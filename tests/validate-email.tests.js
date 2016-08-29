QUnit.module('register');


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

QUnit.test('validateEmailAddressFormat_EmptyDomain_ShouldReject', function (assert) {
    assert.expect(1);

    // Arrange
    var addr = 'example@';

    // Act
    var result = validateEmailAddressFormat(addr);

    // Assert
    assert.notOk(result, 'Address without domain part should fail');
});

QUnit.test('validateEmailAddressFormat_SimpleAddress_ShouldAccept', function (assert) {
    assert.expect(1);

    // Arrange
    var addr = 'abc@def.com';

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
        'ab"c"d@example.com',       // "
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

QUnit.test('validateEmailAddressFormat_LocalhasEscapedSymbols_ShouldAccept', function (assert) {

    // Arrange
    var addresses = [
        'abc\\@def@example.com',      // @ in middle of local part
        '\\@abc@example.com',         // @ at start of local part
        'abc\\@@example.com',         // @ at end of local part
        'ab\\"c\\"d@example.com',       // "
        'abc\\[@example.com',         // [
        'abc\\]@example.com',         // ]
        'abc\\[\\]def@example.com',     // [ and ]
        'abc\\[def\\]ghi@example.com',  // [ and ]
        'abc\\ def@example.com',      // space
        'abc\\\ndef@example.com',     // newline
        'abc\\,def@example.com'       // comma
        ];
    var results = [];

    // Act
    addresses.forEach(function(addr) {
        results.push({address:addr, result:validateEmailAddressFormat(addr)});
    }); 

    // Assert
    assert.expect(addresses.length);
    results.forEach(function(result) {
        assert.ok(result.result, '"' + result.address + '" has escaped symbols in the local part and should pass');
    })
});

QUnit.test('validateEmailAddressFormat_LocalhasQuotedSymbols_ShouldAccept', function (assert) {

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
        '"abc\ndef"@example.com',
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
