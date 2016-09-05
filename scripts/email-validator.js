function EmailValidator(options) {
    var that = this;
    
    
    this._fws = defineFws.call(that, true);
    
    
    
    
    
    function _LocalPart(options) {
        
    }
    
    function _DomainPart(options) {
        
    }
}

// Helper functions
EmailValidator.prototype._makeAlternatives = function makeAlternatives() {
    var nonNull = [];
    for (var idx in arguments) {
        var arg = arguments[idx];
        if (arg !== undefined && arg !== null) {
            nonNull.push(arg);
        }
    }
    return '(' + nonNull.join('|') + ')';
}

EmailValidator.prototype._atext = String.raw`[\`\-a-zA-Z0-9!#$%&'*+/=?^_{|}~]`;
EmailValidator.prototype._wsp = '( |\t)';


function defineFws(allowObsolete) {
    var strictFws = '((' + this._wsp + '*' + String.raw`\n)?` + this._wsp + '+)';
    var obsFws = '(' + this._wsp + String.raw`+(\n` + this._wsp + '+)*)';
    return allowObsolete ?
            this._makeAlternatives(strictFws, obsFws) :
            strictFws;
}
