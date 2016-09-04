QUnit.module('emailValidator_UnitTests');


QUnit.test('emailValidator_WSP_MatchesSpaceAndTab', function (assert) {
    // Arrange
    var inputs = [
        ' ',
        '\t',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = new RegExp(target._wsp)

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

QUnit.test('emailValidator_WSP_DoesNotMatchOtherChars', function (assert) {
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
    var resultRe = new RegExp(target._wsp)

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

