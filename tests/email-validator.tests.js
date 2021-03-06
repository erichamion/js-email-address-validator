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

QUnit.test('EmailValidator_atext_MatchesValidAtext', function (assert) {
    // Arrange
    var inputs = [
        '\`',
        '-',
        'q',
        'Q',
        '3',
        '!',
        '#',
        '$',
        '%',
        '&',
        "'",
        '*',
        '+',
        '/',
        '=',
        '?',
        '^',
        '_',
        '{',
        '|',
        '}',
        '~',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._atext)

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.ok(result.result, '"' + result.input + '" is atext and should pass');
    })
});

QUnit.test('EmailValidator_atext_DoesNotMatchInvalidAtext', function (assert) {
    // Arrange
    var inputs = [
        '(',
        ')',
        '<',
        '>',
        '[',
        ']',
        ':',
        ';',
        '@',
        '\\',
        ',',
        '.',
        '"',
        ' ',
        '\t',
        '\x07',
        '\\ ',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._atext)

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.notOk(result.result, '"' + result.input + '" is invalid atext and should fail');
    })
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

QUnit.test('LocalPart_qtext_MatchesValidQtext', function (assert) {
    // Arrange
    var inputs = [
        'q',
        '3',
        '!',
        '~',
        '\x07',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._localPart._qtext)

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.ok(result.result, '"' + result.input + '" is qtext and should pass');
    })
});

QUnit.test('LocalPart_qtext_DoesNotMatchInvalidQtext', function (assert) {
    // Arrange
    var inputs = [
        ' ',
        '\t',
        '\n',
        '"',
        '\\',
        '\\"',
        '\\ ',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._localPart._qtext)

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.notOk(result.result, '"' + result.input + '" is not qtext and should fail');
    })
});







QUnit.module('EmailValidator_WithOptions_LowestLevel');

QUnit.test('LocalPart_qtext_MatchesValidQtext', function (assert) {
    // Arrange
    var inputs = [
        'q',
        '3',
        '!',
        '~',
        '\x07',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._localPart._qtext)

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.ok(result.result, '"' + result.input + '" is qtext and should pass');
    })
});

QUnit.test('LocalPart_qtext_DoesNotMatchControlCharacters', function (assert) {
    // Arrange
    var inputs = [
        '\x07',
        '\x03',
        ];
    var options = { allowQuotedControlCharacters: false };
    var target = new EmailValidator(options);
    var results = [];
    var resultRe = makeAnchoredRegex(target._localPart._qtext)

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.notOk(result.result, '"' + result.input + '" is not qtext and should fail');
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

QUnit.test('LocalPart_localAtext_MatchesValidAtext', function (assert) {
    // Arrange
    var inputs = [
        '\`',
        '-',
        'q',
        'Q',
        '3',
        '!',
        '#',
        '$',
        '%',
        '&',
        "'",
        '*',
        '+',
        '/',
        '=',
        '?',
        '^',
        '_',
        '{',
        '|',
        '}',
        '~',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._localPart._atext)

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.ok(result.result, '"' + result.input + '" is atext and should pass');
    })
});

QUnit.test('LocalPart_localAtext_DoesNotMatchInvalidAtext', function (assert) {
    // Arrange
    var inputs = [
        '(',
        ')',
        '<',
        '>',
        '[',
        ']',
        ':',
        ';',
        '@',
        '\\',
        ',',
        '.',
        '"',
        ' ',
        '\t',
        '\x07',
        '\\ ',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._localPart._atext)

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.notOk(result.result, '"' + result.input + '" is invalid atext and should fail');
    })
});

QUnit.test('DomainPart_dtext_MatchesValidDtext', function (assert) {
    // Arrange
    var inputs = [
        'q',
        '!',
        '~',
        '<',
        '^',
        '"',
        '\x03',
        '\x7F',
        '\\ ',
        '\\\n',
        '\\[',
        '\\]',
        '\\\\',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._domainPart._dtext)

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.ok(result.result, '"' + result.input + '" is valid dtext and should pass');
    })
});

QUnit.test('DomainPart_dtext_DoesNotMatchInvalidDtext', function (assert) {
    // Arrange
    var inputs = [
        'qq',
        '\\',
        '[',
        ']',
        '\0',
        ' ',
        '\t',
        '\n',
        '\x0D',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._domainPart._dtext)

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.notOk(result.result, '"' + result.input + '" is invalid dtext and should fail');
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

QUnit.test('EmailValidator_atextAllowBareEscapes_MainAtextDoesNotMatchEscapes', function (assert) {
    // Arrange
    var inputs = [
        '\\ ',
        '\\\n',
        '\\\x07',
        ];
    var options = { allowBareEscapes: true };
    var target = new EmailValidator(options);    var results = [];
    var resultRe = makeAnchoredRegex(target._atext)

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.notOk(result.result, '"' + result.input + '" is invalid atext and should fail');
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

QUnit.test('LocalPart_localAtextAllowBareEscapes_MatchesValidAtextAndQuotedPair', function (assert) {
    // Arrange
    var inputs = [
        '\`',
        '-',
        'q',
        'Q',
        '3',
        '!',
        '#',
        '$',
        '%',
        '&',
        "'",
        '*',
        '+',
        '/',
        '=',
        '?',
        '^',
        '_',
        '{',
        '|',
        '}',
        '~',
        '\\ ',
        '\\\n',
        '\\\x07',
        ];
    var options = { allowBareEscapes: true };
    var target = new EmailValidator(options);
    var results = [];
    var resultRe = makeAnchoredRegex(target._localPart._atext)

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.ok(result.result, '"' + result.input + '" is atext and should pass');
    })
});

QUnit.test('DomainPart_dtextDisallowDomainLiteralEscapes_MatchesValidDtext', function (assert) {
    // Arrange
    var inputs = [
        'q',
        '!',
        '~',
        '<',
        '^',
        '"',
        ];
    var options = { allowDomainLiteralEscapes: false };
    var target = new EmailValidator(options);
    var results = [];
    var resultRe = makeAnchoredRegex(target._domainPart._dtext)

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.ok(result.result, '"' + result.input + '" is valid dtext and should pass');
    })
});

QUnit.test('DomainPart_dtextDisallowDomainLiteralEscapes_DoesNotMatchInvalidDtext', function (assert) {
    // Arrange
    var inputs = [
        'qq',
        '\\',
        '[',
        ']',
        '\0',
        ' ',
        '\t',
        '\n',
        '\x0D',
        '\x03',
        '\x7F',
        '\\ ',
        '\\\n',
        '\\[',
        '\\]',
        '\\\\',
        ];
    var options = { allowDomainLiteralEscapes: false };
    var target = new EmailValidator(options);
    var results = [];
    var resultRe = makeAnchoredRegex(target._domainPart._dtext)

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.notOk(result.result, '"' + result.input + '" is invalid dtext and should fail');
    })
});









QUnit.module('EmailValidator_Default_MidLevel');


QUnit.test('CfwsValidator_Comment_MatchesValidComments', function (assert) {
    // Arrange
    var inputs = [
        '()',
        '(This is a comment)',
        '(This is a (nested) comment)',
        '(comment with \n newline in folding whitespace)',
        '(comment with \x07control \x01characters)',
        '(comment with \\( escaped \\\\ characters)',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._cfwsValidator._comment)

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.ok(result.result, '"' + result.input + '" is a valid comment and should pass');
    })
});

QUnit.test('CfwsValidator_Comment_DoesNotMatchInvalidComment', function (assert) {
    // Arrange
    var inputs = [
        'No parentheses',
        '(Only open parenthesis',
        'Only close parenthesis)',
        '(Invalid\nfolding whitespace)',
        '(Bare backslash\\)',
        '(Nested comment is (correct but) outer is not closed',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._cfwsValidator._comment)

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.notOk(result.result, '"' + result.input + '" is an invalid comment and should fail');
    })
});

QUnit.test('LocalPart_qcontent_MatchesValidQcontent', function (assert) {
    // Arrange
    var inputs = [
        'q',
        '3',
        '!',
        '~',
        '\x07',
        '\\"',
        '\\ ',
        '\\\n',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._localPart._qcontent)

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.ok(result.result, '"' + result.input + '" is qcontent and should pass');
    })
});

QUnit.test('LocalPart_qcontent_DoesNotMatchInvalidQcontent', function (assert) {
    // Arrange
    var inputs = [
        ' ',
        '\t',
        '\n',
        '"',
        '\\',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._localPart._qcontent)

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.notOk(result.result, '"' + result.input + '" is not qcontent and should fail');
    })
});

QUnit.test('LocalPart_localAtom_MatchesValidAtom', function (assert) {
    // Arrange
    var inputs = [
        'a',
        'a-b',
        'foo_bar_baz',
        'foo!3bar',
        '3!#$%&\'*+/=?^_{|}~',
        '(comment)foo',
        'foo(comment)',
        ' \n (comment) \n foo\t(comment)',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._localPart._buildAtom());

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.ok(result.result, '"' + result.input + '" is a valid atom and should pass');
    })
});

QUnit.test('LocalPart_localAtom_DoesNotMatchInvalidAtom', function (assert) {
    // Arrange
    var inputs = [
        '',
        'a.b',
        'a.b.',
        '.',
        'foo(bar',
        'foo)bar',
        '<foo',
        '>foo',
        'foo[]',
        'foo bar',
        'foo\tbar',
        '\\tfoo',
        'foo@bar',
        'foo\x07bar',
        'foo\\ bar',
        'foo\\\x07bar',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._localPart._buildAtom());

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.notOk(result.result, '"' + result.input + '" is an invalid atom and should fail');
    })
});








QUnit.module('EmailValidator_Default_HighLevel');

QUnit.test('CfwsValidator_CFWS_MatchesValidCFWS', function (assert) {
    // Arrange
    var inputs = [
        '()',
        ' \n ',
        '   \n\t(comment) \n (comment)  ',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._cfwsValidator.matchString)

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.ok(result.result, '"' + result.input + '" is valid CFWS and should pass');
    })
});

QUnit.test('CfwsValidator_CFWS_DoesNotMatchInvalidCFWS', function (assert) {
    // Arrange
    var inputs = [
        '',
        ' (open parentheses',
        '(comment) \n\n\n (comment)',
        '(comment)notcomment',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._cfwsValidator.matchString)

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.notOk(result.result, '"' + result.input + '" is invalid CFWS and should fail');
    })
});

QUnit.test('CfwsValidator_CFWS_MatchesValidCFWS', function (assert) {
    // Arrange
    var inputs = [
        '()',
        ' \n ',
        '   \n\t(comment) \n (comment)  ',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._cfwsValidator.matchString)

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.ok(result.result, '"' + result.input + '" is valid CFWS and should pass');
    })
});

QUnit.test('LocalPart_localDotAtomText_MatchesValidDotAtomText', function (assert) {
    // Arrange
    var inputs = [
        'a',
        'a.b',
        'foo.bar.baz',
        'foo!.3bar',
        '3!#$%&\'*.+/=?.^_{|}.~',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._localPart._buildDotAtomText());

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.ok(result.result, '"' + result.input + '" is a valid dot-atom-text and should pass');
    })
});

QUnit.test('LocalPart_localDotAtomText_DoesNotMatchInvalidDotAtomText', function (assert) {
    // Arrange
    var inputs = [
        '',
        '.a',
        'a.b.',
        '.',
        'foo(.3bar',
        'foo)bar',
        '<foo',
        '>foo',
        'foo[]',
        'foo bar',
        'foo\tbar',
        '\\tfoo',
        'foo@bar',
        'foo\x07bar',
        'foo\\ bar',
        '\\\t\\\n.\\ \\\t.foo',
        'foo\\\x07bar',
        '(comment)foo.bar',
        'foo(comment)',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._localPart._buildDotAtomText());

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.notOk(result.result, '"' + result.input + '" is an invalid dot-atom-text and should fail');
    })
});

QUnit.test('LocalPart_QuotedString_MatchesValidQuotedString', function (assert) {
    // Arrange
    var inputs = [
        '""',
        '"foo"',
        '"foo....bar"',
        '"foo bar"',
        '"foo(bar"',
        '"foo \n bar"',
        '(comment) "foo" \n ',
        '"foo\\\nbar"',
        '"foo\x07bar"',
        '"foo\\"bar"',
        '"foo<>bar"',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._localPart._quotedString)

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.ok(result.result, '"' + result.input + '" is a valid quoted-string and should pass');
    })
});

QUnit.test('LocalPart_qcontent_DoesNotMatchInvalidQuotedString', function (assert) {
    // Arrange
    var inputs = [
        'notquoted',
        '"unbalanced quote',
        String.raw`'wrong quote type'`,
        '("within a comment")',
        '"illegal"dquote"',
        '"illegalbackslash\\"',
        '"invalid\n\nFWS',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._localPart._quotedString)

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.notOk(result.result, '"' + result.input + '" is an invalid quoted-string and should fail');
    })
});

QUnit.test('LocalPart_localAtom_MatchesValidWord', function (assert) {
    // Arrange
    var inputs = [
        'a',
        'a-b',
        'foo_bar_baz',
        'foo!3bar',
        '3!#$%&\'*+/=?^_{|}~',
        '(comment)foo',
        'foo(comment)',
        ' \n (comment) \n foo\t(comment)',
        '"quoted string"',
        '(comment) "quoted string"',
        '""',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._localPart._word);

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.ok(result.result, '"' + result.input + '" is a valid word and should pass');
    })
});

QUnit.test('LocalPart_Word_DoesNotMatchInvalidWord', function (assert) {
    // Arrange
    var inputs = [
        '',
        'a.b',
        'a.b.',
        '.',
        'foo(bar',
        'foo)bar',
        '<foo',
        '>foo',
        'foo[]',
        'foo bar',
        'foo\tbar',
        '\\tfoo',
        'foo@bar',
        'foo\x07bar',
        'foo\\ bar',
        'foo\\\x07bar',
        'abc"def"ghi',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._localPart._word);

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.notOk(result.result, '"' + result.input + '" is an invalid word and should fail');
    })
});









QUnit.module('EmailValidator_WithOptions_HighLevel');

QUnit.test('LocalPart_localDotAtomTextAllowBareEscapes_MatchesDotAtomTextWithQuotedPairs', function (assert) {
    // Arrange
    var inputs = [
        'foo\\ bar',
        '\\\t\\\n.\\ \\\t.foo',
        'foo\\\x07bar',
        ];
    var options = { allowBareEscapes: true }
    var target = new EmailValidator(options);
    var results = [];
    var resultRe = makeAnchoredRegex(target._localPart._buildDotAtomText());

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.ok(result.result, '"' + result.input + '" is a valid dot-atom-text and should pass');
    })
});

QUnit.test('LocalPart_localDotAtomTextAllowBareEscapes_DoesNotMatchInvalidDotAtomText', function (assert) {
    // Arrange
    var inputs = [
        '',
        '.a',
        'a.b.',
        '.',
        'foo(.3bar',
        'foo)bar',
        '<foo',
        '>foo',
        'foo[]',
        'foo bar',
        'foo\tbar',
        '\\tfoo',
        'foo@bar',
        'foo\x07bar',
        '(comment)foo.bar',
        'foo(comment)',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._localPart._buildDotAtomText());

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.notOk(result.result, '"' + result.input + '" is an invalid dot-atom-text and should fail');
    })
});






QUnit.module('EmailValidator_Default_HigherLevel');

QUnit.test('LocalPart_localDotAtom_MatchesValidDotAtom', function (assert) {
    // Arrange
    var inputs = [
        'a',
        'a.b',
        'foo.bar.baz',
        'foo!.3bar',
        '3!#$%&\'*.+/=?.^_{|}.~',
        '(comment)a',
        '((nested) comment)a.b ',
        '\t\n foo.bar.baz\t\n ',
        'foo!.3bar(comment \n comment)',
        '3!#$%&\'*.+/=?.^_{|}.~   (comment)',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._localPart._buildDotAtom());

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.ok(result.result, '"' + result.input + '" is a valid dot-atom and should pass');
    })
});

QUnit.test('LocalPart_localDotAtom_DoesNotMatchInvalidDotAtom', function (assert) {
    // Arrange
    var inputs = [
        '',
        '.a',
        'a.b.',
        '.',
        '"foo"',
        'foo."bar"',
        '"foo".bar',
        'foo."bar".baz',
        'foo"bar"baz',
        'foo(.3bar',
        'foo)bar',
        '<foo',
        '>foo',
        'foo[]',
        'foo bar',
        'foo\tbar',
        '\\tfoo',
        'foo@bar',
        '(comment)foo\x07bar',
        'foo\\ bar',
        '\\\t\\\n.\\ \\\t.foo',
        'foo\\\x07bar',
        '(comment)',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._localPart._buildDotAtom());

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.notOk(result.result, '"' + result.input + '" is an invalid dot-atom and should fail');
    })
});

QUnit.test('LocalPart_ObsoleteLocalPart_MatchesValid', function (assert) {
    // Arrange
    var inputs = [
        'a',
        'a-b',
        'foo_bar_baz',
        'foo.bar',
        '(comment)foo',
        'foo.(comment) \n bar',
        'foo(comment) \n .bar',
        '"foo".bar',
        'foo."bar".baz',
        'foo.(comment)"bar".baz',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._localPart._obsLocalPart);

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.ok(result.result, '"' + result.input + '" is a valid obsolete local part and should pass');
    })
});

QUnit.test('LocalPart_ObsoleteLocalPart_DoesNotMatchInvalid', function (assert) {
    // Arrange
    var inputs = [
        '',
        '.a.b',
        'a.b.',
        '.',
        'foo(bar',
        'foo)bar',
        '<foo',
        '>foo',
        'foo[]',
        'foo bar',
        'foo\tbar',
        '\\tfoo',
        'foo@bar',
        'foo\x07bar',
        'foo\\ bar',
        'foo\\\x07bar',
        'abc"def"ghi',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._localPart._obsLocalPart);

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.notOk(result.result, '"' + result.input + '" is an invalid obsolete local part and should fail');
    })
});

QUnit.test('DomainPart_domainDotAtom_MatchesValidDotAtom', function (assert) {
    // Arrange
    var inputs = [
        'a',
        'a.b',
        'foo.bar.baz',
        'foo.3bar',
        '(comment)foo',
        '((nested) comment)foo.bar ',
        '\t\n foo.bar.baz\t\n ',
        'foo.3bar(comment \n comment)',
        'foo-bar',
        'foo---bar.baz',
        'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijk.abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijk.abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijk',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._domainPart._buildDotAtom());

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.ok(result.result, '"' + result.input + '" is a valid dot-atom and should pass');
    })
});

QUnit.test('DomainPart_domainDotAtom_DoesNotMatchInvalidDotAtom', function (assert) {
    // Arrange
    var inputs = [
        '',
        '.a',
        'a.b.',
        '.',
        '-foo',
        'foo-',
        'foo.-bar',
        'foo-.bar',
        'foo(comment).bar',
        'foo.(comment)bar',
        '"foo"',
        'foo."bar"',
        '"foo".bar',
        'foo."bar".baz',
        'foo"bar"baz',
        'foo(.3bar',
        'foo)bar',
        '<foo',
        '>foo',
        'foo[]',
        'foo bar',
        'foo\tbar',
        '\\tfoo',
        'foo@bar',
        '(comment)foo\x07bar',
        'foo\\ bar',
        '\\\t\\\n.\\ \\\t.foo',
        'foo\\\x07bar',
        '(comment)',
        'foo!bar',
        'foo#bar',
        'foo$bar',
        'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijkl',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._domainPart._buildDotAtom());

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.notOk(result.result, '"' + result.input + '" is an invalid dot-atom and should fail');
    })
});

QUnit.test('DomainPart_DomainLiteral_MatchesValidDomainLiteral', function (assert) {
    // Arrange
    var inputs = [
        '[]',
        '[127.0.0.1]',
        '(comment) \n [127.0.0.1]',
        '[ \n foo\t\n bar \n\t]',
        '[foo\x07bar]',
        '[foo)bar]',
        '[foo"bar]',
        '[foo\\[bar]',
        '[foo\\]bar]',
        '[foo\\\x0Dbar]',
        '[foo\\\\bar]',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._domainPart._domainLiteral);

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.ok(result.result, '"' + result.input + '" is a valid domain literal and should pass');
    })
});

QUnit.test('DomainPart_DomainLiteral_DoesNotMatchInvalidDomainLiteral', function (assert) {
    // Arrange
    var inputs = [
        '',
        '[noclosebracket',
        'noopenbracket]',
        '(badcomment[foo]',
        '[bad\nFWS]',
        '[foo[bar]',
        '[foo]bar]',
        '[foo\x0Dbar]',
        '[foo\\]',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._domainPart._domainLiteral);

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.notOk(result.result, '"' + result.input + '" is an invalid domain literal and should fail');
    })
});

QUnit.test('DomainPart_ObsoleteDomain_MatchesValid', function (assert) {
    // Arrange
    var inputs = [
        'a',
        'a.b',
        'foo.bar.baz',
        'foo.3bar',
        '(comment)foo',
        '((nested) comment)foo.bar ',
        '\t\n foo.bar.baz\t\n ',
        'foo.3bar(comment \n comment)',
        'foo-bar',
        'foo---bar.baz',
        'foo(comment).bar',
        'foo.(comment)bar',
        'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijk.abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijk.abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijk',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._domainPart._obsDomain);

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.ok(result.result, '"' + result.input + '" is a valid obsolete domain and should pass');
    })
});

QUnit.test('DomainPart_ObsoleteDomain_DoesNotMatchInvalid', function (assert) {
    // Arrange
    var inputs = [
        '',
        '.a',
        'a.b.',
        '.',
        '-foo',
        'foo-',
        'foo.-bar',
        'foo-.bar',
        '"foo"',
        'foo."bar"',
        '"foo".bar',
        'foo."bar".baz',
        'foo"bar"baz',
        'foo(.3bar',
        'foo)bar',
        '<foo',
        '>foo',
        'foo[]',
        'foo bar',
        'foo\tbar',
        '\\tfoo',
        'foo@bar',
        '(comment)foo\x07bar',
        'foo\\ bar',
        '\\\t\\\n.\\ \\\t.foo',
        'foo\\\x07bar',
        '(comment)',
        'foo!bar',
        'foo#bar',
        'foo$bar',
        'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijkl',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._domainPart._obsDomain);

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.notOk(result.result, '"' + result.input + '" is an invalid obsolete domain and should fail');
    })
});










QUnit.module('EmailValidator_WithOptions_HighLevel');

QUnit.test('DomainPart_DomainLiteralDisallowEscapes_DoesNotMatchInvalidDomainLiteral', function (assert) {
    // Arrange
    var inputs = [
        '[foo\\[bar]',
        '[foo\\]bar]',
        '[foo\\\x0Dbar]',
        '[foo\\\\bar]',
        ];
    var options = { allowDomainLiteralEscapes: false }
    var target = new EmailValidator(options);
    var results = [];
    var resultRe = makeAnchoredRegex(target._domainPart._domainLiteral);

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.notOk(result.result, '"' + result.input + '" is an invalid domain literal and should fail');
    })
});







QUnit.module('EmailValidator_Default_HigherLevel');

QUnit.test('LocalPart_LocalPart_MatchesValid', function (assert) {
    // Arrange
    var inputs = [
        'a',
        'a-b',
        'foo_bar_baz',
        'foo.bar',
        '(comment)foo',
        '"foo"',
        '"foo.bar"',
        'foo.(comment) \n bar',
        'foo(comment) \n .bar',
        '"foo".bar',
        'foo."bar".baz',
        'foo.(comment)"bar".baz',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._localPart.matchString);

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.ok(result.result, '"' + result.input + '" is a valid local part and should pass');
    })
});

QUnit.test('LocalPart_LocalPart_DoesNotMatchInvalid', function (assert) {
    // Arrange
    var inputs = [
        '',
        '.a.b',
        'a.b.',
        '.',
        'foo(bar',
        'foo)bar',
        '<foo',
        '>foo',
        'foo[]',
        'foo bar',
        'foo\tbar',
        '\\tfoo',
        'foo@bar',
        'foo\x07bar',
        'foo\\ bar',
        'foo\\\x07bar',
        'abc"def"ghi',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._localPart.matchString);

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.notOk(result.result, '"' + result.input + '" is an invalid local part and should fail');
    })
});

QUnit.test('DomainPart_DomainPart_MatchesValid', function (assert) {
    // Arrange
    var inputs = [
        'a',
        'a.b',
        'foo.bar.baz',
        'foo.3bar',
        '(comment)foo',
        '((nested) comment)foo.bar ',
        '\t\n foo.bar.baz\t\n ',
        'foo.3bar(comment \n comment)',
        'foo-bar',
        'foo---bar.baz',
        'foo(comment).bar',
        'foo.(comment)bar',
        '[]',
        '[127.0.0.1]',
        '(comment) \n [127.0.0.1]',
        '[ \n foo\t\n bar \n\t]',
        '[foo\x07bar]',
        '[foo)bar]',
        '[foo"bar]',
        '[foo\\[bar]',
        '[foo\\]bar]',
        '[foo\\\x0Dbar]',
        '[foo\\\\bar]',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._domainPart.matchString);

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.ok(result.result, '"' + result.input + '" is a valid domain and should pass');
    })
});

QUnit.test('DomainPart_DomainPart_DoesNotMatchInvalid', function (assert) {
    // Arrange
    var inputs = [
        '',
        '.a',
        'a.b.',
        '.',
        '-foo',
        'foo-',
        'foo.-bar',
        'foo-.bar',
        '"foo"',
        'foo."bar"',
        '"foo".bar',
        'foo."bar".baz',
        'foo"bar"baz',
        'foo(.3bar',
        'foo)bar',
        '<foo',
        '>foo',
        'foo[]',
        'foo bar',
        'foo\tbar',
        '\\tfoo',
        'foo@bar',
        '(comment)foo\x07bar',
        'foo\\ bar',
        '\\\t\\\n.\\ \\\t.foo',
        'foo\\\x07bar',
        '(comment)',
        'foo!bar',
        'foo#bar',
        'foo$bar',
        '[noclosebracket',
        'noopenbracket]',
        '(badcomment[foo]',
        '[bad\nFWS]',
        '[foo[bar]',
        '[foo]bar]',
        '[foo\x0Dbar]',
        '[foo\\]',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._domainPart.matchString);

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.notOk(result.result, '"' + result.input + '" is an invalid domain and should fail');
    })
});









QUnit.module('EmailValidator_WithOptions_HigherLevel');

QUnit.test('LocalPart_LocalPartNoSeparateLabels_MatchesValid', function (assert) {
    // Arrange
    var inputs = [
        'a',
        'a-b',
        'foo_bar_baz',
        'foo.bar',
        '(comment)foo',
        '"foo"',
        '"foo.bar"',
        'foo.bar (comment) \n ',
        ' \n (comment) \n foo.bar',
        ];
    var options = { separateLocalLabels: false };
    var target = new EmailValidator(options);
    var results = [];
    var resultRe = makeAnchoredRegex(target._localPart.matchString);

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.ok(result.result, '"' + result.input + '" is a valid local part and should pass');
    })
});

QUnit.test('LocalPart_LocalPartNoSeparateLabels_DoesNotMatchInvalid', function (assert) {
    // Arrange
    var inputs = [
        '',
        '.a.b',
        'a.b.',
        '.',
        'foo(bar',
        'foo)bar',
        '<foo',
        '>foo',
        'foo[]',
        'foo bar',
        'foo\tbar',
        '\\tfoo',
        'foo@bar',
        'foo\x07bar',
        'foo\\ bar',
        'foo\\\x07bar',
        'abc"def"ghi',
        '"foo".bar',
        'foo."bar".baz',
        'foo.(comment)"bar".baz',
        ];
    var options = { separateLocalLabels: false };
    var target = new EmailValidator(options);
    var results = [];
    var resultRe = makeAnchoredRegex(target._localPart.matchString);

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.notOk(result.result, '"' + result.input + '" is an invalid local part and should fail');
    })
});








QUnit.module('EmailValidator_Default_HighestLevel');

QUnit.test('EmailValidator_addrSpec_MatchesValid', function (assert) {
    // Arrange
    var inputs = [
        'a@b',
        'abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijkl@abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijk.abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijk.abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghi',
        '(comment with \n FWS) foo.(comment)"bar".baz@[127.0.0.1] (comment)',
        'foo@(comment ) \n example (comment) .  \n (comment) com (comment)',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._addrSpec);

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.ok(result.result, '"' + result.input + '" is a valid address and should pass');
    })
});

QUnit.test('EmailValidator_addrSpec_DoesNotMatchInvalid', function (assert) {
    // Arrange
    var inputs = [
        '',
        '.a.b@example.com',
        'a.b.@example.com',
        '.@example.com',
        'foo',
        'foo(bar@example.com',
        'foo)bar@example.com',
        '@',
        'foo@',
        '@foo',
        'foo bar@example.com',
        'foo@127.0.0.1]',
        ];
    var target = new EmailValidator();
    var results = [];
    var resultRe = makeAnchoredRegex(target._addrSpec);

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.notOk(result.result, '"' + result.input + '" is an invalid address and should fail');
    })
});









QUnit.module('EmailValidator_WithOptions_HighestLevel');

QUnit.test('EmailValidator_addrSpecLocalAllowed_MatchesFullAndLocalAddresses', function (assert) {
    // Arrange
    var inputs = [
        'foo',
        'foo@bar',
        ];
    var options = { allowLocalAddresses: true };
    var target = new EmailValidator(options);
    var results = [];
    var resultRe = makeAnchoredRegex(target._addrSpec);

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.ok(result.result, '"' + result.input + '" is a valid full or local address and should pass');
    })
});

QUnit.test('EmailValidator_addrSpecLocalRequired_MatchesLocalAddress', function (assert) {
    // Arrange
    var inputs = [
        'foo',
        ];
    var options = { allowLocalAddresses: -1 };
    var target = new EmailValidator(options);
    var results = [];
    var resultRe = makeAnchoredRegex(target._addrSpec);

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.ok(result.result, '"' + result.input + '" is a valid local address and should pass');
    })
});

QUnit.test('EmailValidator_addrSpecLocalRequired_DoesNotMatchFullAddress', function (assert) {
    // Arrange
    var inputs = [
        'foo@bar',
        ];
    var options = { allowLocalAddresses: -1 };
    var target = new EmailValidator(options);
    var results = [];
    var resultRe = makeAnchoredRegex(target._addrSpec);

    // Act
    
    inputs.forEach(function(input) {
        results.push({input:input, result:resultRe.test(input)});
    }); 

    // Assert
    assert.expect(inputs.length);
    results.forEach(function(result) {
        assert.notOk(result.result, '"' + result.input + '" is not a local address and should fail');
    })
});