function EmailValidator(options) {
    var that = this;
    
    this._opts = this._parseOptions(options);
    
    this._fws = defineFws.call(that, this._opts.allowObsoleteFoldingWhitespace);
    
    
    
    
    function _LocalPart(options) {
        
    }
    
    function _DomainPart(options) {
        
    }
}


EmailValidator.prototype = {

    // Helper functions
    _makeAlternatives: function() {
        var nonNull = [];
        for (var idx in arguments) {
            var arg = arguments[idx];
            if (arg !== undefined && arg !== null) {
                nonNull.push(arg);
            }
        }
        return '(' + nonNull.join('|') + ')';
    },

    _coalesce: function(val, def) {
        // Coalesce to default on null or undefined, but not on false/falsey values.
        if (val === undefined || val === null) return def;
        return val;
    },

    _parseOptions: function(options) {
        // Prevent null reference errors
        var opts = options || {};
        var result = {
            allowObsoleteFoldingWhitespace: this._coalesce(opts.allowObsoleteFoldingWhitespace, true),
        }

        return result;
    },
    

    // Constant or constant-like values
    
    // RFC 5322 3.2.3: atext = ALPHA / DIGIT / "!" / "#" / "$" / "%" / "&" / "'" / "*" / "+" / "-" / "/" / "=" / "?" / "^" / "_" / "`" / "{" / "|" / "}" / "~"
    // Printable low-ASCII characters with a number of specific special characters omitted
    _atext: String.raw`[\`\-a-zA-Z0-9!#$%&'*+/=?^_{|}~]`,
    
    // RFC 5322 pulls the WSP definition from RFC 5234.
    // RFC 5234 Appendix B.1: WSP = SP / HTAB
    // Space or (horizontal) tab
    _wsp: '( |\t)',
};


function defineFws(allowObsolete) {
    // RFC 5322 3.2.2: FWS = ([*WSP CRLF] 1*WSP) / obs-FWS
    // Ignoring the obsolete syntax, this is zero or one newline embedded anywhere in a sequence
    // of one or more whitespace characters, as long as the newline is not final character.
    var strictFws = '((' + this._wsp + '*' + String.raw`\n)?` + this._wsp + '+)';
    // RFC 5322 4.2: obs-FWS = 1*WSP *(CRLF 1*WSP)
    // This adds the possibility of multiple newlines, as long as each one is followed by at least
    // one whitespace character, and as long as the sequence does not start with a newline.
    var obsFws = '(' + this._wsp + String.raw`+(\n` + this._wsp + '+)*)';
    return allowObsolete ?
            this._makeAlternatives(strictFws, obsFws) :
            strictFws;
}
