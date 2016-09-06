var _validatorProto = {

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
    
    _subtractMatch: function(original, toSubtract) {
        // Use this if negative character classes (e.g., '[^qwerty]') are not
        // sufficient.
        var subtractLookahead = this._makeLookahead(toSubtract, true);
        return '(' + subtractLookahead + original + ')';
    },
    
    _makeLookahead: function(str, isNegative) {
        return '(?' + (isNegative ? '!' : '=') + str + ')';
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
            allowComments: this._coalesce(opts.allowComments, true),
            allowControlCharactersInComments: this._coalesce(opts.allowControlCharactersInComments, true),
            allowDomainLiteralEscapes: this._coalesce(opts.allowDomainLiteralEscapes, true),
            allowEscapedControlCharacters: this._coalesce(opts.allowEscapedControlCharacters, true),
        }
        
        // Resolve conflicts
        if (!result.allowComments) {
            result.allowControlCharactersInComments = false;
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
    
    // RFC 5322 2.2: "printable US-ASCII characters (i.e., characters that have values between 
    // 33 and 126, inclusive)"
    _printable: '[!-~]',
};

function EmailValidator(options) {
    var that = this;
    
    this._opts = this._parseOptions(options);
    
    this._fws = defineFws.call(this, this._opts.allowObsoleteFoldingWhitespace);
    this._quotedPair = defineQuotedPair.call(this, this._opts.allowEscapedControlCharacters);
    
    this._defineIfApplicable('_obsNoWsCtl', defineObsNoWsCtl, [this._opts.allowControlCharactersInComments, this._opts.allowDomainLiteralEscapes]);
    this._defineIfApplicable('_cfwsValidator', _createCfwsValidator, [this._opts]);
    
    
}
EmailValidator.prototype = _validatorProto;

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

function defineQuotedPair(allowControlChars) {
    // RFC 5322 3.2.1: quoted-pair = ("\" (VCHAR / WSP)) / obs-qp
    // The VCHAR definition is taken from RFC5234, and it is simply the set of printing characters.
    // Without obsolete syntax, this means quoted-pair is backslash followed by any printing or WSP
    // character.
    
    if (allowControlChars) {
        // RFC 5322 4.1: obs-qp = "\" (%d0 / obs-NO-WS-CTL / LF / CR)
        // This, combined with the quoted-pair definition, can be simplified as:
        // Quoted-pair is backslash followed by ANYTHING (including control characters, null, bare
        // linefeed, and bare carriage return).
        return String.raw`(\\[\s\S])`;
    } else {
        return String.raw`(\\` + this._makeAlternatives(this._printable, this._wsp) + ')';
    }
}











function _createCfwsValidator(options) {
    // Create and return a _CfwsValidator if needed, or return null otherwise 
    if (options.allowComments) {
        return new _CfwsValidator(this, options);
    } else {
        return null;
    }
}

function _CfwsValidator(outer, options) {
    this._outer = outer;
    
    this._ctext = _defineCtext.call(this, options.allowControlCharactersInComments);
    this._ccontent = _defineCcontent.call(this);
    this._comment = _defineComment.call(this);
};
_CfwsValidator.prototype = _validatorProto;

function _defineCtext(allowControlCharactersInComments) {
    // RFC 5322 3.2.2: ctext = %d33-39 / %d42-91 / %d93-126 / obs-ctext
    // Without obsolete syntax, this is all printable low-ASCII characters except parentheses
    // and backslash. However, because ccontent includes both ctext and comment, and comment
    // includes ccontent, we need to break the circular definition somehow. We do that by also
    // treating parentheses as ctext.
    var baseCtext = this._subtractMatch(this._printable, String.raw`\\`);
    
    // RFC 5322 4.1: obs-ctext = obs-NO-WS-CTL
    return allowControlCharactersInComments ? 
        this._makeAlternatives(baseCtext, this._outer._obsNoWsCtl) :
        baseCtext;
}

function _defineCcontent() {
    // RFC 5322 3.2.2: ccontent = ctext / quoted-pair / comment
    // We can't include comment in the ccontent definition because ccontent is part of the comment 
    // definition.
    return this._makeAlternatives(this._ctext, this._outer._quotedPair);
}

function _defineComment() {
    // RFC 5322 3.2.2: comment   = "(" *([FWS] ccontent) [FWS] ")"
    // Between the parentheses can be any amount of FWS and any amount of ccontent, with the restriction
    // that no two FWS regions (that can't be merged into a single valid FWS region) are consecutive.
    return String.raw`(\((` + this._outer._fws + '?' + this._ccontent + ')*' + this._outer._fws + String.raw`?\))`;
}