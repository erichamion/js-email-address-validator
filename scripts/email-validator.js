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
    
    _surroundWithOptional: function(center, surround) {
        return '(' + surround + '?' + center + surround + '?)';
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
            allowBareEscapes: this._coalesce(opts.allowBareEscapes, false),
            allowQuotedControlCharacters: this._coalesce(opts.allowQuotedControlCharacters, true),
            separateLocalLabels: this._coalesce(opts.separateLocalLabels, true),
            allowLocalAddresses: this._coalesce(opts.allowLocalAddresses, 0),
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
    
    
    
    
    // Functions that depend on object fields that may vary
    _buildDotAtomText: function() {
        // RFC 5322 3.2.3: dot-atom-text = 1*atext *("." 1*atext)
        // Any number of dot-separated series of atext, each with non-zero length.
        // this._atext may vary depending on options and on what "this" is.
        return '(' + this._atext + '+' + String.raw`(\.` + this._atext + '+)*)';
    },
    
    _buildDotAtom: function() {
        // RFC 5322 3.2.3: dot-atom = [CFWS] dot-atom-text [CFWS]
        // dot-atom-text may vary depending on options and on what "this" is.
        var cfws = this._getCfws && this._getCfws();
        if (cfws) {
            return this._surroundWithOptional(this._buildDotAtomText(), this._getCfws());
        } else {
            return this._buildDotAtomText();
        }
    },
    
    _buildAtom: function() {
        // RFC 5322 3.2.3: atom = [CFWS] 1*atext [CFWS]
        // This is only needed for obs-local-part and obs-domain, so there are combinations of
        // options that don't require it. However, it's easiest to put this here in the prototype
        // regardless of whether it's used.
        var baseAtom = '(' + this._atext + '+)';
        var cfws = this._getCfws && this._getCfws();
        if (cfws) {
            return this._surroundWithOptional(baseAtom, this._getCfws());
        } else {
            return baseAtom;
        }
    },
    
    
    

    // Constant or constant-like values
    
    // RFC 5322 3.2.3: atext = ALPHA / DIGIT / "!" / "#" / "$" / "%" / "&" / "'" / "*" / "+" / "-" / "/" / "=" / "?" / "^" / "_" / "`" / "{" / "|" / "}" / "~"
    // Printable low-ASCII characters with a number of specific special characters omitted
    _atext: String.raw`[\`\-a-zA-Z0-9!#$%&'*+/=?^_{|}~]`,
    
    // RFC 5322 pulls the WSP definition from RFC 5234.
    // RFC 5234 Appendix B.1: WSP = SP / HTAB
    // Space or (horizontal) tab
    _wsp: '[ \t]',
    
    // RFC 5322 2.2: "printable US-ASCII characters (i.e., characters that have values between 
    // 33 and 126, inclusive)"
    _printable: '[!-~]',
};

function EmailValidator(options) {
    this._opts = this._parseOptions(options);
    
    this._getCfws = _getCfwsMain;
    
    this._fws = _defineFws.call(this, this._opts.allowObsoleteFoldingWhitespace);
    this._quotedPair = _defineQuotedPair.call(this, this._opts.allowEscapedControlCharacters);
    
    this._defineIfApplicable('_obsNoWsCtl', _defineObsNoWsCtl, [this._opts.allowControlCharactersInComments, this._opts.allowDomainLiteralEscapes]);
    
    this._defineIfApplicable('_cfwsValidator', _createCfwsValidator, [this._opts]);
    this._localPart = new _LocalPart(this, this._opts);
    this._defineIfApplicable('_domainPart', _createDomainPart, [this._opts]);
    
}
EmailValidator.prototype = _validatorProto;

function _defineFws(allowObsolete) {
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

function _defineObsNoWsCtl(neededForComments, neededForDomainLiterals) {
    // obs-NO-WS-CTL is used in obs-ctext (which is in comments) and in obs-dtext (in domain
    // literals). It's also in the definition of obs-qp (in quoted pair/escaped character), but we
    // simplify the quoted-pair definition so we don't actually use it there. If both comments and
    // domain literals disallow control characters, then there is no need for this.
    if (!neededForComments && !neededForDomainLiterals) return null;
    
    // RFC 5322 4.1: obs-NO-WS-CTL = %d1-8 / %d11 / %d12 / %d14-31 / %d127
    // Control characters that do not include carriage return, line feed, or whitespace
    return String.raw`[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]`;
}

function _defineQuotedPair(allowControlChars) {
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

function _getCfwsMain() {
    return this._cfwsValidator && this._cfwsValidator.matchString;
}

function _getCfwsFromOuter() {
    return this._outer && this._outer._getCfws && this._outer._getCfws();
}

function _createCfwsValidator(options) {
    // Create and return a _CfwsValidator if needed, or return null otherwise 
    if (options.allowComments) {
        return new _CfwsValidator(this, options);
    } else {
        return null;
    }
}

function _createDomainPart(options) {
    // Create and return a _CfwsValidator if needed, or return null otherwise 
    if (options.allowLocalAddresses >= 0) {
        return new _DomainPart(this, options);
    } else {
        return null;
    }
}










function _CfwsValidator(outer, options) {
    this._outer = outer;
    
    this._ctext = _defineCtext.call(this, options.allowControlCharactersInComments);
    this._ccontent = _defineCcontent.call(this);
    this._comment = _defineComment.call(this);
    
    // Put it all together
    this.matchString = _defineCfws.call(this);
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

function _defineCfws() {
    // RFC 5322 3.2.2: CFWS = (1*([FWS] comment) [FWS]) / FWS
    // Any number of comments and FWS regions, as long as there is at least one of either type, and as long as
    // no two FWS regions are consecutive.
    
    return '(((' + this._outer._fws + '?' + this._comment + ')+' + this._outer._fws + '?)|' + this._outer._fws + ')';
}






function _LocalPart(outer, options) {
    this._outer = outer;
    
    this._getCfws = _getCfwsFromOuter;
    
    this._atext = _defineLocalAtext.call(this, options.allowBareEscapes);
    this._qtext = _defineQtext.call(this, options.allowQuotedControlCharacters);
    this._qcontent = _defineQcontent.call(this);
    this._quotedString = _defineQuotedString.call(this);
    
    _defineAndSetObsLocalParts.call(this, options.separateLocalLabels);
    
    this.matchString = _defineLocalPart.call(this);
}
_LocalPart.prototype = _validatorProto;

function _defineLocalAtext(allowEscapes) {
    // RFCs 5322, 5321, and 2822 do not seem to allow quoted-pair in normal (non-comment,
    // non-quoted-string) portions of a local part, but RFC 3696 does, so we provide
    // that as an option. The easiest way is to modify atext for the local part.
    if (allowEscapes) {
        return this._makeAlternatives(this._atext, this._outer._quotedPair);
    } else {
        return this._atext;
    }
}

function _defineQtext(allowControlChars) {
    // RFC 5322 3.2.4: qtext = %d33 / %d35-91 / %d93-126 / obs-qtext
    // RFC 5322 4.1: obs-qtext = obs-NO-WS-CTL
    // With obsolete syntax, this means all low-ASCII characters except null, whitespace, backslash
    // and double-quote. Without obsolete syntax, all printable low-ASCII characters except
    // backslash and double-quote
    var base;
    var toSubtract;
    if (allowControlChars) {
        base = String.raw`[\x01-\x7F]`;
        toSubtract = this._makeAlternatives(String.raw`[\x09\x0A\x0D"\\]`, this._wsp);
    } else {
        base = this._printable;
        toSubtract = String.raw`["\\]`;
    }
    return this._subtractMatch(base, toSubtract);
}

function _defineQcontent() {
    // RFC 5322 3.2.4: qcontent = qtext / quoted-pair
    return this._makeAlternatives(this._qtext, this._outer._quotedPair);
}

function _defineQuotedString() {
    // RFC 5322 3.2.4: quoted-string = [CFWS] DQUOTE *([FWS] qcontent) [FWS] DQUOTE [CFWS]
    // Between the double-quote characters, any sequence of any amount of qcontent and FWS,
    // as long as no two FWS regions (that can't be merged into a single valid FWS region) 
    // are consecutive. The sequence between the double-quotes MAY be zero-length.
    
    var baseQuotedString = '"(' + this._outer._fws + '?' + this._qcontent + ')*' + this._outer._fws + '?"';
    
    var cfws = this._getCfws();
    if (cfws) {
        return this._surroundWithOptional(baseQuotedString, cfws);
    } else {
        return '(' + baseQuotedString + ')';
    }
}

function _defineAndSetObsLocalParts(canHaveObsLocalPart) {
    if (!canHaveObsLocalPart) return;
    
    this._word = _defineWord.call(this);
    this._obsLocalPart = _defineObsLocalPart.call(this);
}

function _defineWord() {
    // RFC 5322 3.2.5: word = atom / quoted-string
    return this._makeAlternatives(this._buildAtom(), this._quotedString);
}

function _defineObsLocalPart() {
    // RFC 5322 4.4: obs-local-part = word *("." word)
    // A sequence of one or more dot-separated words
    return '(' + this._word + String.raw`(\.` + this._word + ')*)';
}

function _defineLocalPart() {
    // RFC 5322 local-part = dot-atom / quoted-string / obs-local-part
    // If _obsLocalPart is not defined, _makeAlternatives will deal with it correctly.
    return this._makeAlternatives(this._buildDotAtom(), this._quotedString, this._obsLocalPart);
}





function _DomainPart(outer, options) {
    this._outer = outer;
    
    this._getCfws = _getCfwsFromOuter;
    
    this._buildDotAtomText = _buildDomainDotAtomText;
    
    this._label = _buildDomainLabel.call(this);
}
_DomainPart.prototype = _validatorProto;

function _buildDomainDotAtomText() {
    // Although RFC 5322 doesn't directly place any restrictions on the dot-atom in the domain,
    // it must be a valid domain. RFC 5322's "atom" corresponds to "label" from RFC 1035 and RFC 
    // 1123, and there are restrictions in those RFCs.
    // This means we can't use the normal atom or dot-atom definition directly here. Instead,
    // use a dot-separated list of labels
    
    return '(' + this._label + String.raw`(\.` + this._label + ')*)';
    
}

function _buildDomainLabel() {
    // Each label may contain dashes, letters, and digits, but cannot start or end with a dash.
    var internalChar = String.raw`[a-zA-Z0-9\-]`;
    var startEndChar = String.raw`[a-zA-Z0-9]`;
    
    // A label may be up to 63 characters long and cannot be empty. Either a single start/end 
    // char (for a one-character-long label),  or 0-61 internal characters surrounded by
    // start/end chars (for more than one character).
    return '(' + startEndChar + '(' + internalChar + '{0,61}' + startEndChar + ')?)';
}