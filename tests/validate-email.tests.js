QUnit.module('register');


QUnit.test('validateEmailAddressFormat_SimpleAddress_Pass', function (assert) {
    assert.expect(1);

    // Arrange
    var addr = 'abc@def.com';

    // Act
    var result = validateEmailAddressFormat(addr);

    // Assert
    assert.ok(result, 'Valid address failed');
});