// Helper functions used by tests
function makeAnchoredRegex(regexString) {
    return new RegExp('^' + regexString + '$');
}



QUnit.module('EmailValidator_Default_LowestLevel');

QUnit.test('EmailValidator_makeAlternatives_MakesValidAlternatives', function (assert) {
    // Arrange
    var inputs = [
        [],
        ['foo-bar'],
        ['(abc+)', '(\\.def)'],        
        ['a', 'b', 'c'],
        ['z', 'xxx', '([^qwerty])', '((?![abc]).*)'],
        ];
    var expected = [
        '()',
        '(foo-bar)',
        '((abc+)|(\\.def))',
        '(a|b|c)',
        '(z|xxx|([^qwerty])|((?![abc]).*))',
    ]
    var actuals = [];
    var emailValidator = new EmailValidator();
    var target = emailValidator._makeAlternatives;

    // Act
    
    inputs.forEach(function(input) {
        actuals.push(target.apply(emailValidator, input));
    }); 

    // Assert
    assert.expect(inputs.length);
    for (var i = 0; i < inputs.length; i++) {
        assert.equal(actuals[i], expected[i], 'Input: ' + inputs[i] + ', Expected: ' + expected[i] + ', Actual: ' + actuals[i]);
    }
});

QUnit.test('EmailValidator_subtractMatch_MakesValidMatches', function (assert) {
    // Arrange
    var inputs = [
        ['[a-z]', 'q'],
        ['[a-z]', 'q'],
        ['(.*)', '[a-z]'],
        ['(.*)', '[a-z]'],
        ['(.*)', '[a-z]'],
        ];
    var testData = [
        'r',
        'q',
        'foo',
        '!foo',
        'f!oo',
    ]
    var expected = [
        true,
        false,
        false,
        true,
        false,
    ]
    var actuals = [];
    var emailValidator = new EmailValidator();
    var target = emailValidator._subtractMatch;

    // Act
    for (var i = 0; i < inputs.length; i++) {
        actuals.push(makeAnchoredRegex(target.apply(emailValidator, inputs[i])).test(testData[i]));
    }; 

    // Assert
    assert.expect(inputs.length);
    for (var i = 0; i < inputs.length; i++) {
        assert.equal(actuals[i], expected[i], 'Input: ' + inputs[i] + 'TestData: ' + testData[i] + ', Expected: ' + expected[i] + ', Actual: ' + actuals[i]);
    }
});

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

QUnit.test('EmailValidator_obsNoWsCtl_MatchesControlChars', function (assert) {
    // Arrange
    var inputs = [
        '\x01',
        '\x05',
        '\x08',
        '\x0B',
        '\x0C',
        '\x10',
        '\x1F',
        '\x7F',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._obsNoWsCtl)

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.ok(result.result, '"' + result.input + '" is a non-whitespace control character and should pass');
    })
});





QUnit.module('EmailValidator_WithOptions_LowestLevel');







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

QUnit.test('CfwsValidator_ctext_MatchesValidCtext', function (assert) {
    // Arrange
    var inputs = [
        'q',
        '!',
        '~',
        '<',
        ']',
        '^',
        '\x03',
        '\x7F',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._cfwsValidator._ctext)

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.ok(result.result, '"' + result.input + '" is valid ctext and should pass');
    })
});

QUnit.test('CfwsValidator_ctext_DoesNotMatchInvalidCtext', function (assert) {
    // Arrange
    var inputs = [
        '\\',
        ' ',
        '\t',
        '\0',
        '\\ ',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._cfwsValidator._ctext)

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.notOk(result.result, '"' + result.input + '" is invalid ctext and should fail');
    })
});

QUnit.test('CfwsValidator_ccontent_MatchesValidCcontent', function (assert) {
    // Arrange
    var inputs = [
        'q',
        '!',
        '~',
        '<',
        ']',
        '^',
        '\x03',
        '\x7F',
        '\\ ',
        '\\\\',
        '\\\n',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._cfwsValidator._ccontent)

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.ok(result.result, '"' + result.input + '" is valid ccontent and should pass');
    })
});

QUnit.test('CfwsValidator_ccontent_DoesNotMatchInvalidCcontent', function (assert) {
    // Arrange
    var inputs = [
        '\\',
        ' ',
        '\t',
        '\0',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._cfwsValidator._ccontent)

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.notOk(result.result, '"' + result.input + '" is invalid ccontent and should fail');
    })
});

QUnit.test('EmailValidator_quotedPair_MatchesValidQuotedPair', function (assert) {
    // Arrange
    var inputs = [
        String.raw`\[`,
        String.raw`\q`,
        String.raw`\!`,
        String.raw`\ `,
        '\\\t',
        '\\\0',
        '\\\x0D',
        '\\\x0A',
        '\\\x07',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._quotedPair)

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.ok(result.result, '"' + result.input + '" is a valid quoted-pair and should pass');
    })
});

QUnit.test('EmailValidator_quotedPair_DoesNotMatchInvalidQuotedPair', function (assert) {
    // Arrange
    var inputs = [
        '\\',
        'q',
        '\\qq',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._quotedPair)

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.notOk(result.result, '"' + result.input + '" is an invalid quoted-pair and should fail');
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

QUnit.test('CfwsValidator_ctextDisallowControlChars_MatchesValidCtext', function (assert) {
    // Arrange
    var inputs = [
        'q',
        '!',
        '~',
        '<',
        ']',
        '^',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._cfwsValidator._ctext)

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.ok(result.result, '"' + result.input + '" is valid ctext and should pass');
    })
});

QUnit.test('CfwsValidator_ctextDisallowControlChars_DoesNotMatchInvalidCtext', function (assert) {
    // Arrange
    var inputs = [
        '\\',
        ' ',
        '\t',
        '\0',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._cfwsValidator._ctext)

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.notOk(result.result, '"' + result.input + '" is invalid ctext and should fail');
    })
});

QUnit.test('CfwsValidator_ctextDisallowControlChars_DoesNotMatchControlChars', function (assert) {
    // Arrange
    var inputs = [
        '\03',
        '\7F',
        ];
    var options = {allowControlCharactersInComments: false};
    var target = new EmailValidator(options);
    var results = [];
    var resultRe = makeAnchoredRegex(target._cfwsValidator._ctext)

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.notOk(result.result, '"' + result.input + '" is invalid ctext and should fail');
    })
});

QUnit.test('EmailValidator_quotedPairDisallowControlChars_MatchesValidQuotedPair', function (assert) {
    // Arrange
    var inputs = [
        String.raw`\[`,
        String.raw`\q`,
        String.raw`\!`,
        String.raw`\ `,
        '\\\t',
        ];
    var options = { allowEscapedControlCharacters: false };
    var target = new EmailValidator(options);
    var results = [];
    var resultRe = makeAnchoredRegex(target._quotedPair)

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.ok(result.result, '"' + result.input + '" is a valid quoted-pair and should pass');
    })
});

QUnit.test('EmailValidator_quotedPairDisallowControlChars_DoesNotMatchInvalidQuotedPair', function (assert) {
    // Arrange
    var inputs = [
        '\\\0',
        '\\\x0D',
        '\\\x0A',
        '\\\x07',
        ];
    var options = { allowEscapedControlCharacters: false };
    var target = new EmailValidator(options);
    var results = [];
    var resultRe = makeAnchoredRegex(target._quotedPair)

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.notOk(result.result, '"' + result.input + '" is a quoted-pair with a control character when that syntax is disallowed and should fail');
    })
});