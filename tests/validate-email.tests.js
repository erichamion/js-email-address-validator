QUnit.module('validateEmailAddress_Default');


QUnit.test('validateEmailAddressFormat_EmptyAddress_ShouldReject', function (assert) {
    assert.expect(1);

    // Arrange
    var addr = '';

    // Act
    var result = validateEmailAddressFormat(addr);

    // Assert
    assert.notOk(result, 'Empty string should fail');
});

QUnit.test('validateEmailAddressFormat_NoAt_ShouldReject', function (assert) {
    assert.expect(1);

    // Arrange
    var addr = 'abcdefg.hijklmn.opqrs.com';

    // Act
    var result = validateEmailAddressFormat(addr);

    // Assert
    assert.notOk(result, 'Address without "@" should fail');
});

QUnit.test('validateEmailAddressFormat_EmptyLocal_ShouldReject', function (assert) {
    assert.expect(1);

    // Arrange
    var addr = '@example.com';

    // Act
    var result = validateEmailAddressFormat(addr);

    // Assert
    assert.notOk(result, 'Address without local part should fail');
});

QUnit.test('validateEmailAddressFormat_MinimalAddress_ShouldAccept', function (assert) {
    assert.expect(1);

    // Arrange
    var addr = 'a@b';

    // Act
    var result = validateEmailAddressFormat(addr);

    // Assert
    assert.ok(result, 'Valid address should pass');
});

QUnit.test('validateEmailAddressFormat_LongLegalAddress_ShouldAccept', function (assert) {
    assert.expect(1);

    // Arrange
    var addr = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijkl@abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijk.abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijk.abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghi';

    // Act
    var result = validateEmailAddressFormat(addr);

    // Assert
    assert.ok(result, 'Valid long address should pass');
});

QUnit.test('validateEmailAddressFormat_TooLong_ShouldReject', function (assert) {
    assert.expect(1);

    // Arrange
    var addr = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijkl@abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijk.abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijk.abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghij';

    // Act
    var result = validateEmailAddressFormat(addr);

    // Assert
    assert.notOk(result, 'Invalid long address should fail');
});

QUnit.test('validateEmailAddressFormat_LocalTooLong_ShouldReject', function (assert) {
    assert.expect(1);

    // Arrange
    var addr = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklm@example.com';

    // Act
    var result = validateEmailAddressFormat(addr);

    // Assert
    assert.notOk(result, 'Address with over 64 characters in local part should fail');
});

QUnit.test('validateEmailAddressFormat_LocalPartHasValidSymbols_ShouldAccept', function (assert) {
    assert.expect(1);

    // Arrange
    var addr = "!#$%&'*+-/=?^_`{|}~@example.com";

    // Act
    var result = validateEmailAddressFormat(addr);

    // Assert
    assert.ok(result, 'Address with valid symbols in the local part should pass');
});

QUnit.test('validateEmailAddressFormat_LocalPartHasDots_ShouldAccept', function (assert) {
    assert.expect(1);

    // Arrange
    var addr = "abc.def.ghi.j.k@example.com";

    // Act
    var result = validateEmailAddressFormat(addr);

    // Assert
    assert.ok(result, 'Address with nonconsecutive . characters in the local part should pass');
});

QUnit.test('validateEmailAddressFormat_LocalPartHasConsecutiveDots_ShouldReject', function (assert) {
    assert.expect(1);

    // Arrange
    var addr = "abc..def@example.com";

    // Act
    var result = validateEmailAddressFormat(addr);

    // Assert
    assert.notOk(result, 'Address with consecutive . characters in the local part should fail');
});

QUnit.test('validateEmailAddressFormat_LocalPartStartsWithDot_ShouldReject', function (assert) {
    assert.expect(1);

    // Arrange
    var addr = ".abc@example.com";

    // Act
    var result = validateEmailAddressFormat(addr);

    // Assert
    assert.notOk(result, 'Address with local part starting with . character should fail');
});

QUnit.test('validateEmailAddressFormat_LocalPartEndsWithDot_ShouldReject', function (assert) {
    assert.expect(1);

    // Arrange
    var addr = "abc.@example.com";

    // Act
    var result = validateEmailAddressFormat(addr);

    // Assert
    assert.notOk(result, 'Address with local part ending with . character should fail');
});

QUnit.test('validateEmailAddressFormat_LocalHasInvalidSymbol_ShouldReject', function (assert) {

    // Arrange
    var addresses = [
        'abc@def@example.com',      // @ in middle of local part
        '@abc@example.com',         // @ at start of local part
        'abc@@example.com',         // @ at end of local part
        'ab"c"d@example.com',       // " in the wrong location
        '"abc@example.com',         // unbalanced "
        'abc"@example.com',         // unbalanced "
        'abc[@example.com',         // [
        'abc]@example.com',         // ]
        'abc[]def@example.com',     // [ and ]
        'abc[def]ghi@example.com',  // [ and ]
        'abc def@example.com',      // space
        'abc\ndef@example.com',     // newline
        'abc,def@example.com'       // comma
        ];
    var results = [];

    // Act
    addresses.forEach(function(addr) {
        results.push({address:addr, result:validateEmailAddressFormat(addr)});
    }); 

    // Assert
    assert.expect(addresses.length);
    results.forEach(function(result) {
        assert.notOk(result.result, '"' + result.address + '" has invalid characters in the local part and should fail');
    })
});

QUnit.test('validateEmailAddressFormat_LocalHasBareEscapedSymbols_ShouldReject', function (assert) {

    // Arrange
    var addresses = [
        'abc\\@def@example.com',        // @ in middle of local part
        '\\@abc@example.com',           // @ at start of local part
        'abc\\@@example.com',           // @ at end of local part
        'ab\\"c\\"d@example.com',       // "
        '\\"abc@example.com',           // unbalanced "
        'abc\\"@example.com',           // unbalanced "
        'abc\\[@example.com',           // [
        'abc\\]@example.com',           // ]
        'abc\\[\\]def@example.com',     // [ and ]
        'abc\\[def\\]ghi@example.com',  // [ and ]
        'abc\\ def@example.com',        // space
        'abc\\\ndef@example.com',       // newline
        'abc\\,def@example.com',        // comma
        'abc.\\.def@example.com',       // consecutive dot
        'abc\\..def@example.com',       // consecutive dot
        '\\.abc@example.com',           // leading dot
        'abc\\.@example.com',           // trailing dot
        '\\a\\b\\c\\!#\\$%\\&\'*\\+-\\/=\\?^\\_`{\\|}~@example.com' // Unnecessarily escaped characters
        ];
    var results = [];

    // Act
    addresses.forEach(function(addr) {
        results.push({address:addr, result:validateEmailAddressFormat(addr)});
    }); 

    // Assert
    assert.expect(addresses.length);
    results.forEach(function(result) {
        assert.notOk(result.result, '"' + result.address + '" has escaped symbols in the local part and should fail');
    })
});

QUnit.test('validateEmailAddressFormat_LocalHasQuotedSymbols_ShouldAccept', function (assert) {

    // Arrange
    var addresses = [
        '"abc"@example.com',            
        '"abc@def"@example.com',        
        '"@abc".def@example.com',       
        'xyz."abc@"@example.com',       
        '"abc["@example.com',           
        'xyz."abc]".def@example.com',   
        '"abc[]def"@example.com',       
        '"abc[def]ghi"@example.com',    
        '"abc def"@example.com',        
        '"abc\n\tdef"@example.com',
        '"abc,def"@example.com',
        '"abc....def"@example.com',     
        'abc."def@".ghi@example.com',
        '"abc".def."ghi"@example.com'
        ];
    var results = [];

    // Act
    addresses.forEach(function(addr) {
        results.push({address:addr, result:validateEmailAddressFormat(addr)});
    }); 

    // Assert
    assert.expect(addresses.length);
    results.forEach(function(result) {
        assert.ok(result.result, '"' + result.address + '" has a quoted section in the local part and should pass');
    })
});

QUnit.test('validateEmailAddressFormat_LocalHasInvalidCharactersInQuotedString_ShouldReject', function (assert) {

    // Arrange
    var addresses = [
        '"a"bc"@example.com',            
        '"abc"@"def"@example.com',        
        '"@abc\\".def@example.com',  
        '"abc\x03def@example.com'
        ];
    var results = [];

    // Act
    addresses.forEach(function(addr) {
        results.push({address:addr, result:validateEmailAddressFormat(addr)});
    }); 

    // Assert
    assert.expect(addresses.length);
    results.forEach(function(result) {
        assert.notOk(result.result, '"' + result.address + '" has invalid characters within a quoted section in the local part and should fail');
    })
});

QUnit.test('validateEmailAddressFormat_LocalHasEscapedCharactersInQuotedString_ShouldAccept', function (assert) {

    // Arrange
    var addresses = [
        '"a\\"bc"@example.com',         // Escaped " 
        '"abc\\"@\\"def"@example.com',  // Escaped pair of "
        '"@abc\\\\".def@example.com',   // Escaped backslash
        '"\\a\\b\\c"@example.com'       // Unnecessarily escaped characters
        ];
    var results = [];

    // Act
    addresses.forEach(function(addr) {
        results.push({address:addr, result:validateEmailAddressFormat(addr)});
    }); 

    // Assert
    assert.expect(addresses.length);
    results.forEach(function(result) {
        assert.ok(result.result, '"' + result.address + '" has escaped characters within a quoted section in the local part and should pass');
    })
});

QUnit.test('validateEmailAddressFormat_EmptyDomain_ShouldReject', function (assert) {
    assert.expect(1);

    // Arrange
    var addr = 'example@';

    // Act
    var result = validateEmailAddressFormat(addr);

    // Assert
    assert.notOk(result, 'Address without domain part should fail');
});

QUnit.test('validateEmailAddressFormat_DomainTooLong_ShouldReject', function (assert) {
    assert.expect(1);

    // Arrange
    var addr = 'me@abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijk.abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijk.abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijk.abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijkl';

    // Act
    var result = validateEmailAddressFormat(addr);

    // Assert
    assert.notOk(result, 'Domain part longer than 255 characters should fail');
});

QUnit.test('validateEmailAddressFormat_DomainLiteralBadBrackets_ShouldReject', function (assert) {
    // Arrange
    var addresses = [
        'me@[127.0.0.1',            
        'me@127.0.0.1]',        
        'me@127[.0.0.1]',  
        'me@[127.0.0].1',
        'me@[127.0.[0].1]',
        'me@[127.0.0.1\\]'
        ];
    var results = [];

    // Act
    addresses.forEach(function(addr) {
        results.push({address:addr, result:validateEmailAddressFormat(addr)});
    }); 

    // Assert
    assert.expect(addresses.length);
    results.forEach(function(result) {
        assert.notOk(result.result, '"' + result.address + '" has an invalid domain literal and should fail');
    })
});

QUnit.test('validateEmailAddressFormat_DomainLiteralValid_ShouldAccept', function (assert) {
    assert.expect(1);

    // Arrange
    var addr = 'me@[This is a valid domain literal. <Really>, it is!\nTrust me. (It isn\'t meaningful in any way, though.)]';

    // Act
    var result = validateEmailAddressFormat(addr);

    // Assert
    assert.ok(result, 'Valid address should pass');
});

QUnit.test('validateEmailAddressFormat_DomainLiteralEscapedCharacters_ShouldAccept', function (assert) {
    // Arrange
    var addresses = [
        'me@[127\\[.0.0.1]',  
        'me@[127.0.0\\].1]',
        'me@[127.0.\\[0\\].1]',
        'me@[127.0.0.1\\\\]'
        ];
    var results = [];

    // Act
    addresses.forEach(function(addr) {
        results.push({address:addr, result:validateEmailAddressFormat(addr)});
    }); 

    // Assert
    assert.expect(addresses.length);
    results.forEach(function(result) {
        assert.ok(result.result, '"' + result.address + '" has escaped characters in the domain literal and should pass');
    })
});

QUnit.test('validateEmailAddressFormat_DomainValidCharacters_ShouldAccept', function (assert) {
    assert.expect(1);

    // Arrange
    var addr = 'me@abcde-fghi-jklmno--pqrstuvw---xyz012-----345-6789';

    // Act
    var result = validateEmailAddressFormat(addr);

    // Assert
    assert.ok(result, 'Valid domain should pass');
});

QUnit.test('validateEmailAddressFormat_DomainValidCharacters_ShouldReject', function (assert) {
    // Arrange
    var addresses = [
        'me@abc,def',  
        'me@abc..com',
        'me@abc>def',
        'me@abc"def',
        'me@abc`def',
        'me@abc:def',
        'me@abc\\"def'
        ];
    var results = [];

    // Act
    addresses.forEach(function(addr) {
        results.push({address:addr, result:validateEmailAddressFormat(addr)});
    }); 

    // Assert
    assert.expect(addresses.length);
    results.forEach(function(result) {
        assert.notOk(result.result, '"' + result.address + '" has invalid characters in the domain and should fail');
    })
});

QUnit.test('validateEmailAddressFormat_DomainLabelStartsWithDash_ShouldReject', function (assert) {
    assert.expect(1);

    // Arrange
    var addr = 'me@abc.-def.com';

    // Act
    var result = validateEmailAddressFormat(addr);

    // Assert
    assert.notOk(result, 'Domain label starting with dash should fail');
});

QUnit.test('validateEmailAddressFormat_DomainLabelEndsWithDash_ShouldReject', function (assert) {
    assert.expect(1);

    // Arrange
    var addr = 'me@abc.def-.com';

    // Act
    var result = validateEmailAddressFormat(addr);

    // Assert
    assert.notOk(result, 'Domain label ending with dash should fail');
});

QUnit.test('validateEmailAddressFormat_DomainLongValidLabels_ShouldAccept', function (assert) {
    assert.expect(1);

    // Arrange
    var addr = 'me@abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijk.abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijk.abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijk.abcdefghijklmnopqrstuvwxyza';

    // Act
    var result = validateEmailAddressFormat(addr);

    // Assert
    assert.ok(result, 'Domain labels up to 63 characters long should pass');
});

QUnit.test('validateEmailAddressFormat_DomainLabelTooLong_ShouldReject', function (assert) {
    assert.expect(1);

    // Arrange
    var addr = 'me@abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijkl.com';

    // Act
    var result = validateEmailAddressFormat(addr);

    // Assert
    assert.notOk(result, 'Domain label longer than 63 characters should fail');
});

QUnit.test('validateEmailAddressFormat_CommentsValid_ShouldAccept', function (assert) {
    // Arrange
    var addresses = [
        '(comment)(comment)me(comment comment comment)@(comment)abc(comment)(comment)(comment).(comment)def(comment)',  
        '(comment (nested comment ("third level"!) (another @third level)))me@abc.com',
        'me@abc(comment with a \n folding newline).def',
        'me(comment\twith spaces, tabs, \n\tand newlines)@example.com',
        '()me@abc().def'
        ];
    var results = [];

    // Act
    addresses.forEach(function(addr) {
        results.push({address:addr, result:validateEmailAddressFormat(addr)});
    }); 

    // Assert
    assert.expect(addresses.length);
    results.forEach(function(result) {
        assert.ok(result.result, '"' + result.address + '" has valid comments and should pass');
    })
});

QUnit.test('validateEmailAddressFormat_CommentsMisplaced_ShouldReject', function (assert) {
    // Arrange
    var addresses = [
        'before(comment cannot be inside a local label. Must be before or after the label)after@abc.def',  
        'me@before(comment cannot be inside a domain label. Must be before or after the label)after',
        'me@unmatched.parentheses)',
        'me@unmatched.parentheses('
        ];
    var results = [];

    // Act
    addresses.forEach(function(addr) {
        results.push({address:addr, result:validateEmailAddressFormat(addr)});
    }); 

    // Assert
    assert.expect(addresses.length);
    results.forEach(function(result) {
        assert.notOk(result.result, '"' + result.address + '" has invalid comments and should fail');
    })
});

QUnit.test('validateEmailAddressFormat_CommentsBadNesting_ShouldReject', function (assert) {
    // Arrange
    var addresses = [
        '(comment (inner comment)abc@abc.def',  
        'me@(inner comment) comment)after',
        'me(comment.has(nested inner comment).and starts.before@and.has.another(nested inner).but.ends.after.the.at)def.com',
        ];
    var results = [];

    // Act
    addresses.forEach(function(addr) {
        results.push({address:addr, result:validateEmailAddressFormat(addr)});
    }); 

    // Assert
    assert.expect(addresses.length);
    results.forEach(function(result) {
        assert.notOk(result.result, '"' + result.address + '" has invalid comments and should fail');
    })
});

QUnit.test('validateEmailAddressFormat_FWSValid_ShouldAccept', function (assert) {
    // Arrange
    var addresses = [
        'me \n\t@\tabc \n (comment) .def \n '
        ];
    var results = [];

    // Act
    addresses.forEach(function(addr) {
        results.push({address:addr, result:validateEmailAddressFormat(addr)});
    }); 

    // Assert
    assert.expect(addresses.length);
    results.forEach(function(result) {
        assert.ok(result.result, '"' + result.address + '" has valid Folding Whitespace and should pass');
    })
});

QUnit.test('validateEmailAddressFormat_FWSInvalid_ShouldReject', function (assert) {
    // Arrange
    var addresses = [
        'me\n@abc.def'
        ];
    var results = [];

    // Act
    addresses.forEach(function(addr) {
        results.push({address:addr, result:validateEmailAddressFormat(addr)});
    }); 

    // Assert
    assert.expect(addresses.length);
    results.forEach(function(result) {
        assert.notOk(result.result, '"' + result.address + '" has invalid Folding Whitespace and should fail');
    })
});

QUnit.test('validateEmailAddressFormat_CommentsInvalidFWS_ShouldReject', function (assert) {
    // Arrange
    var addresses = [
        '(comment with \nnewline not followed by space or tab)abc@abc.def',  
        'me@(inner comment) comment)after',
        'me(comment.has(nested inner comment).and starts.before@and.has.another(nested inner).but.ends.after.the.at)def.com',
        'me(comment with \x03 control character)@examle.com',
        ];
    var results = [];

    // Act
    addresses.forEach(function(addr) {
        results.push({address:addr, result:validateEmailAddressFormat(addr)});
    }); 

    // Assert
    assert.expect(addresses.length);
    results.forEach(function(result) {
        assert.notOk(result.result, '"' + result.address + '" has invalid whitespace (does not conform to Folding Whitespace) in comments and should fail');
    })
});





QUnit.module('validateEmailAddress_WithOptions');


QUnit.test('validateEmailAddressFormat_LocalDisallowedEscapedSymbols_ShouldReject', function (assert) {

    // Arrange
    var addresses = [
        'abc\\@def@example.com',        // @ in middle of local part
        '\\@abc@example.com',           // @ at start of local part
        'abc\\@@example.com',           // @ at end of local part
        'ab\\"c\\"d@example.com',       // "
        '\\"abc@example.com',           // unbalanced "
        'abc\\"@example.com',           // unbalanced "
        'abc\\[@example.com',           // [
        'abc\\]@example.com',           // ]
        'abc\\[\\]def@example.com',     // [ and ]
        'abc\\[def\\]ghi@example.com',  // [ and ]
        'abc\\ def@example.com',        // space
        'abc\\\ndef@example.com',       // newline
        'abc\\,def@example.com',        // comma
        'abc.\\.def@example.com',       // consecutive dot
        'abc\\..def@example.com',       // consecutive dot
        '\\.abc@example.com',           // leading dot
        'abc\\.@example.com',           // trailing dot
        '\\a\\b\\c\\!#\\$%\\&\'*\\+-\\/=\\?^\\_`{\\|}~@example.com' // Unnecessarily escaped characters
        ];
    var options = { allowBareEscapes:false };
    var results = [];

    // Act
    addresses.forEach(function(addr) {
        results.push({address:addr, result:validateEmailAddressFormat(addr, options)});
    }); 

    // Assert
    assert.expect(addresses.length);
    results.forEach(function(result) {
        assert.notOk(result.result, '"' + result.address + '" has escaped symbols in the local part, but disallows bare escapes, and should fail');
    })
});

QUnit.test('validateEmailAddressFormat_LocalAllowedEscapedSymbols_ShouldAccept', function (assert) {

    // Arrange
    var addresses = [
        'abc\\@def@example.com',        // @ in middle of local part
        '\\@abc@example.com',           // @ at start of local part
        'abc\\@@example.com',           // @ at end of local part
        'ab\\"c\\"d@example.com',       // "
        '\\"abc@example.com',           // unbalanced "
        'abc\\"@example.com',           // unbalanced "
        'abc\\[@example.com',           // [
        'abc\\]@example.com',           // ]
        'abc\\[\\]def@example.com',     // [ and ]
        'abc\\[def\\]ghi@example.com',  // [ and ]
        'abc\\ def@example.com',        // space
        'abc\\\ndef@example.com',       // newline
        'abc\\,def@example.com',        // comma
        'abc.\\.def@example.com',       // consecutive dot
        'abc\\..def@example.com',       // consecutive dot
        '\\.abc@example.com',           // leading dot
        'abc\\.@example.com',           // trailing dot
        '\\a\\b\\c\\!#\\$%\\&\'*\\+-\\/=\\?^\\_`{\\|}~@example.com' // Unnecessarily escaped characters
        ];
    var options = { allowBareEscapes:true };
    var results = [];

    // Act
    addresses.forEach(function(addr) {
        results.push({address:addr, result:validateEmailAddressFormat(addr, options)});
    }); 

    // Assert
    assert.expect(addresses.length);
    results.forEach(function(result) {
        assert.ok(result.result, '"' + result.address + '" has escaped symbols in the local part, but explicitly allows bare escapes, and should pass');
    })
});

QUnit.test('validateEmailAddressFormat_LocalHasQuotedEscapesWhenBareEscapesDisallowed_ShouldAccept', function (assert) {

    // Arrange
    var addresses = [
        '"abc\\@def"@example.com',        // @ in middle of local part
        '"\\@abc"@example.com',           // @ at start of local part
        '"abc\\@"@example.com',           // @ at end of local part
        '"ab\\"c\\"d"@example.com',       // "
        '"\\"abc"@example.com',           // unbalanced "
        'def."abc\\""@example.com',           // unbalanced "
        '"abc\\[".def@example.com',           // [
        '"abc\\]"@example.com',           // ]
        '"abc\\[\\]def"@example.com',     // [ and ]
        '"abc\\[def\\]ghi"@example.com',  // [ and ]
        '"abc\\ def"@example.com',        // space
        '"abc\\\ndef"@example.com',       // newline
        '"abc\\,def"@example.com',        // comma
        '"abc.\\.def"@example.com',       // consecutive dot
        '"abc\\..def"@example.com',       // consecutive dot
        '"\\.abc"@example.com',           // leading dot
        '"abc\\."@example.com',           // trailing dot
        '"\\a\\b\\c\\!#\\$%\\&\'*\\+-\\/=\\?^\\_`{\\|}~"@example.com' // Unnecessarily escaped characters
        ];
    var options = { allowBareEscapes: false };
    var results = [];

    // Act
    addresses.forEach(function(addr) {
        results.push({address:addr, result:validateEmailAddressFormat(addr, options)});
    }); 

    // Assert
    assert.expect(addresses.length);
    results.forEach(function(result) {
        assert.ok(result.result, '"' + result.address + '" has escaped symbols within a quoted string and should pass');
    })
});

QUnit.test('validateEmailAddressFormat_DisallowCommentsAndDoesNotHaveComments_ShouldAccept', function (assert) {
    // Arrange
    var addresses = [
        'me@example.com',  
        'me@[127.0.0.1]',
        '"quoted string"@example.com',
        ];
    var options = { allowComments: false };
    var results = [];

    // Act
    addresses.forEach(function(addr) {
        results.push({address:addr, result:validateEmailAddressFormat(addr, options)});
    }); 

    // Assert
    assert.expect(addresses.length);
    results.forEach(function(result) {
        assert.ok(result.result, '"' + result.address + '" is valid and should pass');
    })
});

QUnit.test('validateEmailAddressFormat_CommentsDisallowed_ShouldReject', function (assert) {
    // Arrange
    var addresses = [
        '(comment)(comment)me(comment comment comment)@(comment)abc(comment)(comment)(comment).(comment)def(comment)',  
        '(comment (nested comment ("third level"!) (another @third level)))me@abc.com',
        'me@abc(comment with a \nnewline).def',
        '()me@abc().def'
        ];
    var options = { allowComments: false };
    var results = [];

    // Act
    addresses.forEach(function(addr) {
        results.push({address:addr, result:validateEmailAddressFormat(addr, options)});
    }); 

    // Assert
    assert.expect(addresses.length);
    results.forEach(function(result) {
        assert.notOk(result.result, '"' + result.address + '" has comments, but options disallow comments, and should fail');
    })
});

QUnit.test('validateEmailAddressFormat_FullAddressWithLocalExplicitlyDisallowed_ShouldAccept', function (assert) {
    // Arrange
    var addresses = [
        'abc@def.com'
        ];
    var options = { allowLocalAddresses: 0 };
    var results = [];

    // Act
    addresses.forEach(function(addr) {
        results.push({address:addr, result:validateEmailAddressFormat(addr, options)});
    }); 

    // Assert
    assert.expect(addresses.length);
    results.forEach(function(result) {
        assert.ok(result.result, '"' + result.address + '" is a non-local address with local addresses disallowed and should pass');
    })
});

QUnit.test('validateEmailAddressFormat_LocalAddressWithLocalExplicitlyDisallowed_ShouldReject', function (assert) {
    // Arrange
    var addresses = [
        'abc.def'
        ];
    var options = { allowLocalAddresses: 0 };
    var results = [];

    // Act
    addresses.forEach(function(addr) {
        results.push({address:addr, result:validateEmailAddressFormat(addr, options)});
    }); 

    // Assert
    assert.expect(addresses.length);
    results.forEach(function(result) {
        assert.notOk(result.result, '"' + result.address + '" is a local address with local addresses disallowed and should fail');
    })
});

QUnit.test('validateEmailAddressFormat_FullAddressWithLocalAllowed_ShouldAccept', function (assert) {
    // Arrange
    var addresses = [
        'abc@def.com'
        ];
    var options = { allowLocalAddresses: 1 };
    var results = [];

    // Act
    addresses.forEach(function(addr) {
        results.push({address:addr, result:validateEmailAddressFormat(addr, options)});
    }); 

    // Assert
    assert.expect(addresses.length);
    results.forEach(function(result) {
        assert.ok(result.result, '"' + result.address + '" is a non-local address with local addresses allowed and should pass');
    })
});

QUnit.test('validateEmailAddressFormat_LocalAddressWithLocalAllowed_ShouldAccept', function (assert) {
    // Arrange
    var addresses = [
        'abc.def'
        ];
    var options = { allowLocalAddresses: 1 };
    var results = [];

    // Act
    addresses.forEach(function(addr) {
        results.push({address:addr, result:validateEmailAddressFormat(addr, options)});
    }); 

    // Assert
    assert.expect(addresses.length);
    results.forEach(function(result) {
        assert.ok(result.result, '"' + result.address + '" is a local address with local addresses allowed and should pass');
    })
});

QUnit.test('validateEmailAddressFormat_FullAddressWithLocalRequired_ShouldReject', function (assert) {
    // Arrange
    var addresses = [
        'abc@def.com'
        ];
    var options = { allowLocalAddresses: -1 };
    var results = [];

    // Act
    addresses.forEach(function(addr) {
        results.push({address:addr, result:validateEmailAddressFormat(addr, options)});
    }); 

    // Assert
    assert.expect(addresses.length);
    results.forEach(function(result) {
        assert.notOk(result.result, '"' + result.address + '" is a non-local address with local addresses required and should fail');
    })
});

QUnit.test('validateEmailAddressFormat_LocalAddressWithLocalRequired_ShouldAccept', function (assert) {
    // Arrange
    var addresses = [
        'abc.def'
        ];
    var options = { allowLocalAddresses: -1 };
    var results = [];

    // Act
    addresses.forEach(function(addr) {
        results.push({address:addr, result:validateEmailAddressFormat(addr, options)});
    }); 

    // Assert
    assert.expect(addresses.length);
    results.forEach(function(result) {
        assert.ok(result.result, '"' + result.address + '" is a local address with local addresses required and should pass');
    })
});

QUnit.test('validateEmailAddressFormat_ReturnRegex_ShouldMatchValidAddresses', function (assert) {

    // Arrange
    var addresses = [
        'a@b',
        'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijkl@abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijk.abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijk.abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghi',      
        "!#$%&'*+-/=?^_`{|}~@example.com",        
        '"abc\\"@\\"def"@example.com',        
        'me@[This is a valid domain literal. <Really>, it is!\nTrust me. (It isn\'t meaningful in any way, though.)]',        
        '(comment (nested comment ("third level"!) (another @third level)))me@abc.com',
        'me@[127.0.0.1]'
        ];
    var options = { returnRegex: true };
    var resultRegex;
    var results = [];

    // Act
    resultRegex = validateEmailAddressFormat(null, options);
    addresses.forEach(function(addr) {
        results.push({address:addr, result:resultRegex.test(addr)});
    }); 

    // Assert
    assert.expect(addresses.length);
    results.forEach(function(result) {
        assert.ok(result.result, '"' + result.address + '" is valid and should pass');
    })
});

QUnit.test('validateEmailAddressFormat_ReturnRegexAndDisallowComments_ShouldNotMatchAddressesWithComments', function (assert) {

    // Arrange
    var addresses = [
        '(comment)me@example.com',     
        'me(comment)@example.com',         
        'abc(comment).def@example.com',         
        'me@(comment)example.com',       
        'me@[127.0.0.1](comment)'  
        ];
    var options = { 
        returnRegex: true,
        allowComments: false
    };
    var resultRegex;
    var results = [];

    // Act
    resultRegex = validateEmailAddressFormat(null, options);
    addresses.forEach(function(addr) {
        results.push({address:addr, result:resultRegex.test(addr)});
    }); 

    // Assert
    assert.expect(addresses.length);
    results.forEach(function(result) {
        assert.notOk(result.result, '"' + result.address + '" is has disallowed comments and should fail');
    })
});

QUnit.test('validateEmailAddressFormat_NoSeparateLocalLabelsValid_ShouldAllow', function (assert) {

    // Arrange
    var addresses = [
        'addresswithoutquotes@example.com',     
        '"entirelocalpartisquoted"@example.com',
        '(commentbefore)abc.def@example.com',
        'abc.def(comment after)@example.com',
        '"quotedaddress"(with comments)@example.com', 
        ];
    var options = { 
        separateLocalLabels: false
    };
    var resultRegex;
    var results = [];

    // Act
    resultRegex = validateEmailAddressFormat(null, options);
    addresses.forEach(function(addr) {
        results.push({address:addr, result:validateEmailAddressFormat(addr, options)});
    }); 

    // Assert
    assert.expect(addresses.length);
    results.forEach(function(result) {
        assert.ok(result.result, '"' + result.address + '" is valid and should pass');
    })
});

QUnit.test('validateEmailAddressFormat_NoSeparateLocalLabelsWithQuotedLabels_ShouldReject', function (assert) {

    // Arrange
    var addresses = [
        '"abc".def@example.com',     
        'abc."def"@example.com',
        'abc."def".ghi@example.com',
        '"abc".def."ghi"@example.com', 
        ];
    var options = { 
        separateLocalLabels: false
    };
    var resultRegex;
    var results = [];

    // Act
    resultRegex = validateEmailAddressFormat(null, options);
    addresses.forEach(function(addr) {
        results.push({address:addr, result:validateEmailAddressFormat(addr, options)});
    }); 

    // Assert
    assert.expect(addresses.length);
    results.forEach(function(result) {
        assert.notOk(result.result, '"' + result.address + '" has disallowed quoted individual labels and should fail');
    })
});

QUnit.test('validateEmailAddressFormat_NoSeparateLocalLabelsWithInternalComments_ShouldReject', function (assert) {

    // Arrange
    var addresses = [
        'abc(comment)def@example.com',  
        ];
    var options = { 
        separateLocalLabels: false
    };
    var resultRegex;
    var results = [];

    // Act
    resultRegex = validateEmailAddressFormat(null, options);
    addresses.forEach(function(addr) {
        results.push({address:addr, result:validateEmailAddressFormat(addr, options)});
    }); 

    // Assert
    assert.expect(addresses.length);
    results.forEach(function(result) {
        assert.notOk(result.result, '"' + result.address + '" has disallowed quoted individual labels and should fail');
    })
});