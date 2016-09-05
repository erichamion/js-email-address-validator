function EmailValidator(options) {
    var that = this;
    
    this._opts = this._parseOptions(options);
    
    this._fws = defineFws.call(that, this._opts.allowObsoleteFoldingWhitespace);
    
    this._defineIfApplicable('_obsNoWsCtl', defineObsNoWsCtl, [this._opts.allowControlCharactersInComments, this._opts.allowDomainLiteralEscapes]);
    
    
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
            allowControlCharactersInComments: this._coalesce(opts.allowControlCharactersInComments, true),
            allowDomainLiteralEscapes: this._coalesce(opts.allowDomainLiteralEscapes, true),
        }

        return result;
    },
    
    _defineIfApplicable: function(fieldName, definitionFunction, argArray) {
        var result = definitionFunction.apply(this, argArray);
        if (result !== undefined && result !== null) {
            this[fieldName] = result;
        }
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

function defineObsNoWsCtl(neededForComments, neededForDomainLiterals) {
    // obs-NO-WS-CTL is used in obs-ctext (which is in comments) and in obs-dtext (in domain
    // literals). It's also in the definition of obs-qp (in quoted pair/escaped character), but we
    // simplify the quoted-pair definition so we don't actually use it there. If both comments and
    // domain literals disallow control characters, then there is no need for this.
    if (!neededForComments && !neededForDomainLiterals) return null;
    
    // RFC 5322 4.1: obs-NO-WS-CTL = %d1-8 / %d11 / %d12 / %d14-31 / %d127
    // Control characters that do not include carriage return, line feed, or whitespace
    return String.raw`[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]`;
}
