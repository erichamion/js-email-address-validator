// Helper functions used by tests
function makeAnchoredRegex(regexString) {
    return new RegExp('^' + regexString + '$');
}



QUnit.module('EmailValidator_Default_LowestLevel');


QUnit.test('EmailValidator_WSP_MatchesSpaceAndTab', function (assert) {
    // Arrange
    var inputs = [
        ' ',
        '\t',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._wsp)

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.ok(result.result, '"' + result.input + '" is WSP and should pass');
    })
});

QUnit.test('EmailValidator_WSP_DoesNotMatchOtherChars', function (assert) {
    // Arrange
    var inputs = [
        '\x127',
        'a',
        '7',
        '\n',
        '\x03',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._wsp)

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.notOk(result.result, '"' + result.input + '" is not WSP and should fail');
    })
});




QUnit.module('EmailValidator_Default_LowLevel');


QUnit.test('EmailValidator_FWS_MatchesProperFWS', function (assert) {
    // Arrange
    var inputs = [
        ' ',
        '\t',
        '\n ',
        '   \t \t\n\t',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._fws)

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.ok(result.result, '"' + result.input + '" is FWS and should pass');
    })
});

QUnit.test('EmailValidator_FWS_MatchesObsoleteFWS', function (assert) {
    // Arrange
    var inputs = [
        ' \n \n \n\t\n ',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._fws)

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.ok(result.result, '"' + result.input + '" is obsolete but valid FWS and should pass');
    })
});

QUnit.test('EmailValidator_FWS_DoesNotMatchInvalidFWS', function (assert) {
    // Arrange
    var inputs = [
        ' a ',
        '\x03',
        '\n',
        ' \n\n ',
        ' \n',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._fws)

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.notOk(result.result, '"' + result.input + '" is invalid FWS and should pass');
    })
});

QUnit.module('EmailValidator_WithOptions_LowLevel')

QUnit.test('EmailValidator_FWSDisallowObsolete_MatchesProperFWS', function (assert) {
    // Arrange
    var inputs = [
        ' ',
        '\t',
        '\n ',
        '   \t \t\n\t',
        ];
    var options = { allowObsoleteFoldingWhitespace: false };
    var target = new EmailValidator(options);
    var results = [];
    var resultRe = makeAnchoredRegex(target._fws)

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.ok(result.result, '"' + result.input + '" is FWS and should pass');
    })
});

QUnit.test('EmailValidator_FWSDisallowObsolete_DoesNotMatchObsoleteFWS', function (assert) {
    // Arrange
    var inputs = [
        ' \n \n \n\t\n ',
        ];
    var options = { allowObsoleteFoldingWhitespace: false };
    var target = new EmailValidator(options);
    var results = [];
    var resultRe = makeAnchoredRegex(target._fws)

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.notOk(result.result, '"' + result.input + '" is obsolete FWS but that syntax is disallowed and should fail');
    })
});