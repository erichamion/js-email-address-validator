function EmailValidator(options) {
    var that = this;
    
    this._opts = this._parseOptions(options);
    
    this._fws = defineFws.call(that, this._opts.allowObsoleteFoldingWhitespace);
    
    
    
    
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
};

EmailValidator.prototype._coalesce = function(val, def) {
    // Coalesce to default on null or undefined, but not on false/falsey values.
    if (val === undefined || val === null) return def;
    return val;
};

EmailValidator.prototype._parseOptions = function(options) {
    // Prevent null reference errors
    var opts = options || {};
    var result = {
        allowObsoleteFoldingWhitespace: this._coalesce(opts.allowObsoleteFoldingWhitespace, true),
    }
    
    return result;
};


EmailValidator.prototype._atext = String.raw`[\`\-a-zA-Z0-9!#$%&'*+/=?^_{|}~]`;
EmailValidator.prototype._wsp = '( |\t)';


function defineFws(allowObsolete) {
    var strictFws = '((' + this._wsp + '*' + String.raw`\n)?` + this._wsp + '+)';
    var obsFws = '(' + this._wsp + String.raw`+(\n` + this._wsp + '+)*)';
    return allowObsolete ?
            this._makeAlternatives(strictFws, obsFws) :
            strictFws;
}
