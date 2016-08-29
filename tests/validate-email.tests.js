QUnit.module('register');


QUnit.test('validateEmailAddressFormat_EmptyAddress_Fail', function (assert) {
    assert.expect(1);

    // Arrange
    var addr = '';

    // Act
    var result = validateEmailAddressFormat(addr);

    // Assert
    assert.notOk(result, 'Empty string should fail');
});

QUnit.test('validateEmailAddressFormat_NoAt_Fail', function (assert) {
    assert.expect(1);

    // Arrange
    var addr = 'abcdefg.hijklmn.opqrs.com';

    // Act
    var result = validateEmailAddressFormat(addr);

    // Assert
    assert.notOk(result, 'Address without "@" should fail');
});

QUnit.test('validateEmailAddressFormat_EmptyLocal_Fail', function (assert) {
    assert.expect(1);

    // Arrange
    var addr = '@example.com';

    // Act
    var result = validateEmailAddressFormat(addr);

    // Assert
    assert.notOk(result, 'Address without local part should fail');
});

QUnit.test('validateEmailAddressFormat_EmptyDomain_Fail', function (assert) {
    assert.expect(1);

    // Arrange
    var addr = 'example@';

    // Act
    var result = validateEmailAddressFormat(addr);

    // Assert
    assert.notOk(result, 'Address without domain part should fail');
});

QUnit.test('validateEmailAddressFormat_SimpleAddress_Pass', function (assert) {
    assert.expect(1);

    // Arrange
    var addr = 'abc@def.com';

    // Act
    var result = validateEmailAddressFormat(addr);

    // Assert
    assert.ok(result, 'Valid address should pass');
});

QUnit.test('validateEmailAddressFormat_LongLegalAddress_Pass', function (assert) {
    assert.expect(1);

    // Arrange
    var addr = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijkl@abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijk.abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijk.abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghi';

    // Act
    var result = validateEmailAddressFormat(addr);

    // Assert
    assert.ok(result, 'Valid long address should pass');
});

QUnit.test('validateEmailAddressFormat_TooLong_Fail', function (assert) {
    assert.expect(1);

    // Arrange
    var addr = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijkl@abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijk.abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghijk.abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxyzabcdefghij';

    // Act
    var result = validateEmailAddressFormat(addr);

    // Assert
    QUnit.assert.notOk(result, 'Invalid long address should fail');
});

QUnit.test('validateEmailAddressFormat_LocalTooLong_Fail', function (assert) {
    assert.expect(1);

    // Arrange
    var addr = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklm@example.com';

    // Act
    var result = validateEmailAddressFormat(addr);

    // Assert
    QUnit.assert.notOk(result, 'Address with over 64 characters in local part should fail');
});