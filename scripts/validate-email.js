function validateEmailAddressFormat(address, options) {
    // Functions that may not be needed or that may have different definitions
    // depending on options:
    var checkComments,
        buildLengthLookaheadMatchString,
        //buildDomainPartMatchString,
        //buildDomainLiteralMatchString,
        //buildDomainAtomMatchString,
        buildFullAddressMatchString,
        getResult,
        buildDotAtomMatchString,
        buildQuotedStringMatchString,

        // Option-dependent values
        escapedChar,
        cfwsMatchString,
        fwsMatchString,
        obsNoWsCtlMatchString;
    
    // Constants
    var WSP_MATCH = '( |\t)';
    var PRINTING_MATCH = '[!-~]';
    var ATEXT_STRICT_MATCH = String.raw`[\`\-a-zA-Z0-9!#$%&'*+/=?^_{|}~]`;
    
    
    // Process options and defaults
    var opts = getOptions(options);
    // Prevent unintended use of the bare unprocessed argument
    options = undefined;  
    
    // Assign any functions that depend on options
    defineGlobalFunctions(opts);
    setOptionDependentValues(opts);
    
    // Basic length check
    
    // Compose the regex (stored as a string) to match the entire addresss
    var lengthLookaheadPart = buildLengthLookaheadMatchString(address);
    var localPart = buildLocalPartMatchString(defineLocalPartFunctions(opts), cfwsMatchString, escapedChar);
    var domainPart = buildDomainPartMatchString ? buildDomainPartMatchString(defineDomainPartFunctions(opts), cfwsMatchString, escapedChar) : '';
    var fullAddress = buildFullAddressMatchString(lengthLookaheadPart, localPart, domainPart);
    
    // Surround the regex result with start and end markers, so an address must fill the entire string
    var fullAddressWithEnds = new RegExp('^' + fullAddress + '$');
    
    // Compute the final result
    return getResult(fullAddressWithEnds, address);
    
    
    
    
    // Functions that have constant definition:
    
    
    
    function makeLookahead(str, negativeLookAhead) {
        return '(?' + (negativeLookAhead ? '!' : '=') + str + ')';
    }
    
    function surroundWithOptional(center, surround) {
        return '(' + surround + '?' + center + surround + '?)';
    }
    
    function makeAlternatives() {
        var nonNull = [];
        for (var idx in arguments) {
            var arg = arguments[idx];
            if (arg !== undefined && arg !== null) {
                nonNull.push(arg);
            }
        }
        return '(' + nonNull.join('|') + ')';
    }
    
    function getOptions(options) {
        // Prevent null reference errors
        var optsWithoutDefaults = options || {};
        // Get options from opts, or specify defaults if not given
        var resultOpts = {
            useRegexOnly: coalesce(optsWithoutDefaults.useRegexOnly, false),
            returnRegex: coalesce(optsWithoutDefaults.returnRegex, false),
            allowBareEscapes: coalesce(optsWithoutDefaults.allowBareEscapes, false),
            allowComments: coalesce(optsWithoutDefaults.allowComments, true),
            allowLocalAddresses: coalesce(optsWithoutDefaults.allowLocalAddresses, 0), // non-zero = allowed. negative = required. 
            separateLocalLabels: coalesce(optsWithoutDefaults.separateLocalLabels, true),
            separateDomainLabels: coalesce(optsWithoutDefaults.separateDomainLabels, true),
            allowObsoleteFoldingWhitespace: coalesce(optsWithoutDefaults.allowObsoleteFoldingWhitespace, true),
            allowDomainLiteralEscapes: coalesce(optsWithoutDefaults.allowDomainLiteralEscapes, true),
            allowQuotedControlCharacters: coalesce(optsWithoutDefaults.allowQuotedControlCharacters, true),
            allowEscapedControlCharacters: coalesce(optsWithoutDefaults.allowEscapedControlCharacters, true),
            allowControlCharactersInComments: coalesce(optsWithoutDefaults.allowControlCharactersInComments, true),
        }
        
        // Check for conflicting options
        if (resultOpts.returnRegex && !resultOpts.useRegexOnly && 'returnRegex' in optsWithoutDefaults) {
            console.warn('validateEmailAddressFormat() with inconsistent options. returnRegex is true, but useRegexOnly explicitly set to false.');
        }
        
        // Resolve conflicting options
        if (resultOpts.returnRegex) {
            resultOpts.useRegexOnly = true;
        }
        
        return resultOpts;
        
        function coalesce(val, def) {
            // Coalesce to default on null or undefined, but not on false/falsey values.
            if (val === undefined || val === null) return def;
            return val;
        }
    }
    
    function defineGlobalFunctions(opts) {
        
        getResult = defineGetResult(opts.returnRegex, opts.allowComments && !opts.useRegexOnly);
        buildFullAddressMatchString = defineBuildFullAddressMatchString(opts.allowLocalAddresses);
        checkComments = defineCheckComments(opts.allowComments && !opts.useRegexOnly, !opts.allowLocalAddresses);
        buildLengthLookaheadMatchString = defineBuildLengthLookaheadMatchString(opts.allowLocalAddresses);
        buildDomainPartMatchString = defineBuildDomainPartMatchString(opts.allowLocalAddresses >= 0, opts.allowComments);
        buildDotAtomMatchString = defineBuildDotAtomMatchString(opts.allowComments);
    }
    
    function defineLocalPartFunctions(opts) {
        var getAtextMatchStringForLocal = defineGetAtextMatchStringForLocal(opts.allowBareEscapes);
        var buildLocalAtomMatchString = defineBuildLocalAtomMatchString(opts.allowComments);
        var buildQuotedStringMatchString = defineBuildQuotedStringMatchString(opts.allowComments);
        var buildObsLocalPartMatchString = defineBuildObsLocalPartMatchString(opts.separateLocalLabels);
        var buildLocalAtomMatchString = defineBuildLocalAtomMatchString(opts.allowComments);
        var buildQtextMatchString = defineBuildQtextMatchString(opts.allowQuotedControlCharacters);

        var result = {
            getAtextMatchStringForLocal: getAtextMatchStringForLocal,
            buildLocalAtomMatchString: buildLocalAtomMatchString,
            buildQuotedStringMatchString: buildQuotedStringMatchString,
            buildObsLocalPartMatchString: buildObsLocalPartMatchString,
            buildLocalAtomMatchString: buildLocalAtomMatchString,
            buildQtextMatchString: buildQtextMatchString,
            
            buildUncommentedQuotedString: buildUncommentedQuotedString,
        };
        return result;
        
        
        function defineGetAtextMatchStringForLocal(allowBareEscapes) {
            if (allowBareEscapes) {
                return function(escapedCharMatchString) {
                    return makeAlternatives(ATEXT_STRICT_MATCH, escapedCharMatchString);
                };
            } else {
                return function(ignored) {
                    return ATEXT_STRICT_MATCH;
                };
            }
        }
        
        function defineBuildLocalAtomMatchString(allowComments) {
            // RFC 5322 3.2.3: atom = [CFWS] 1*atext [CFWS]

            if (allowComments) {
                return function(atextMatchString, cfwsMatchString) {
                    var multiAtext = atextMatchString + '+';
                    return surroundWithOptional(multiAtext, cfwsMatchString);
                };
            } else {
                return function(atextMatchString, ignored) {
                    return atextMatchString + '+';
                };
            }
        }
        
        function defineBuildQuotedStringMatchString(allowComments) {
            // RFC 5322 3.2.4: quoted-string = [CFWS] DQUOTE *([FWS] qcontent) [FWS] DQUOTE [CFWS]

            if (allowComments) {
                return function(escapedCharMatchString, cfwsMatchString) {
                    var baseQuotedString = buildUncommentedQuotedString(escapedCharMatchString);
                    return surroundWithOptional(baseQuotedString, cfwsMatchString);
                };
            } else {
                return buildUncommentedQuotedString;
            }
        }
        
        function defineBuildObsLocalPartMatchString(allowObsolete) {
            if (!allowObsolete) {
                return function() {
                    return null;
                }
            } else {
            
                return function(atextMatchString, escapedCharMatchString, cfwsMatchString) {
                    // RFC 5322 4.4: obs-local-part = word *("." word)
                    var word = buildWordMatchString(atextMatchString, escapedCharMatchString, cfwsMatchString);
                    return '(' + word + String.raw`(\.` + word + ')*)';
                };
            }
            
            
        }
        
        function defineBuildQtextMatchString(allowControlChars) {
            
            // RFC 5322 3.2.4: qtext = %d33 / %d35-91 / %d93-126 / obs-qtext
            // RFC 5322 4.1: obs-qtext = obs-NW-WS-CTL
            // With obsolete syntax, this means all low-ASCII characters except whitespace, backslash
            // and double-quote. Without obsolete syntax, all printing low-ASCII characters except
            // backslash and double-quote
            var baseQtext = '(' + makeLookahead(String.raw`[\\"]`, true) + PRINTING_MATCH + ')';
            if (allowControlChars) {
                return function() {
                    return makeAlternatives(baseQtext, obsNoWsCtlMatchString);
                };
            } else {
                return function() {
                    return baseQtext;
                };
            }
            
        }
        
        // Not dynamically generated, but used by both constant and dynamic functions, so this
        // must be accessible here.
        function buildUncommentedQuotedString(escapedCharMatchString) {
            // DQUOTE *([FWS] qcontent) [FWS] DQUOTE
            // qcontent is either qtext or quoted-pair (that is, it's semantically a single character
            // within the quoted string. Note that the quoted string can be empty aside from the
            // surrounding double-quotes.
            var qcontentMatchString = buildQcontentMatchString(escapedCharMatchString)
            return '("(' + fwsMatchString + '?' + qcontentMatchString + ')*' + fwsMatchString + '?")'
        }
        
        function buildQcontentMatchString(escapedCharMatchString) {
            // RFC 5322 3.2.4: qcontent = qtext / quoted-pair
            return makeAlternatives(buildQtextMatchString(), escapedCharMatchString);
        }
        
        // Not dynamically generated, but only used by local dynamically generated functions
        function buildWordMatchString(atextMatchString, escapedCharMatchString, cfwsMatchString) {
            // RFC 5322 3.2.5: word = atom / quoted-string
            var atom = buildLocalAtomMatchString(atextMatchString, cfwsMatchString);
            var qString = buildQuotedStringMatchString(escapedCharMatchString, cfwsMatchString);

            return makeAlternatives(atom, qString);
        }
    }
    
    function defineDomainPartFunctions(opts) {
        if (opts.allowLocalAddresses < 0) return null;
        
        var buildDomainAtomMatchString = defineBuildDomainAtomMatchString(opts.allowComments);
        var buildDomainLiteralMatchString = defineBuildDomainLiteralMatchString(opts.allowComments);
        var buildObsDomainMatchString = defineBuildObsDomainMatchString(opts.separateDomainLabels);
        var buildDtextMatchString = defineBuildDtextMatchString(opts.allowDomainLiteralEscapes);
 
        var buildDomainUncommentedAtomMatchString = buildDomainUncommentedAtomMatchString;
        
        var result = {
            buildDomainAtomMatchString: buildDomainAtomMatchString,
            buildDomainLiteralMatchString: buildDomainLiteralMatchString,
            buildObsDomainMatchString: buildObsDomainMatchString,
            
            buildDomainUncommentedAtomMatchString: buildDomainUncommentedAtomMatchString,
        };
        return result;
        
        function defineBuildDomainAtomMatchString(allowComments) {
            if (allowComments) {
                return function (commentMatchString) {
                    var bareAtom = buildDomainUncommentedAtomMatchString();
                    return surroundWithOptional(bareAtom, commentMatchString);
                };
            } else {
                return buildDomainUncommentedAtomMatchString;
            }
        }
        
        function defineBuildDomainLiteralMatchString(allowComments) {
            // RFC 5322 3.4.1: domain-literal = [CFWS] "[" *([FWS] dtext) [FWS] "]" [CFWS]
            
            if (allowComments) {
                return function( escapedCharMatchString, commentMatchString) {
                    var bareDomain = buildUncommentedDomainLiteralMatchString(escapedCharMatchString);
                    return '(' + commentMatchString + '*' + bareDomain + commentMatchString + '*)';
                };
            } else {
                return function(escapedCharMatchString, ignored) {
                    return buildUncommentedDomainLiteralMatchString(escapedCharMatchString);
                };
            }
            
        }
        
        function defineBuildObsDomainMatchString(allowObsoleteDomain) {
            if (!allowObsoleteDomain) return null;
            
            return function(cfwsMatchString) {
                // RFC 5322 4.4: obs-domain = atom *("." atom)
                // Dot-separated list of one or more atoms. Because there is no option for escaped
                // characters, always use the strict atext.
                var atom = buildDomainAtomMatchString(cfwsMatchString);
                return '(' + atom + String.raw`(\.` + atom + ')*)';
            }
        }
        
        function defineBuildDtextMatchString(allowEscapes) {
            // RFC 5322 3.4.1: dtext = %d33-90 / %d94-126 / obs-dtext
            // If obs-dtext is not allowed, this is equivalent to the printing low-ASCII
            // characters excluding square brackets and backslash.
            var baseDtext = '(' + makeLookahead(String.raw`[\[\]\\]`, true) + PRINTING_MATCH + ')';
            if (allowEscapes) {
                return function(escapeCharMatchString) {
                    // RFC 5322 4.4: obs-dtext = obs-NO-WS-CTL / quoted-pair
                    return makeAlternatives(baseDtext, obsNoWsCtlMatchString, escapeCharMatchString);
                }
            } else {
                return function() {
                    return baseDtext;
                }
            }
        }
    
        
        // Not dynamically generated, but both constant and dynamic functions depend on this,
        // so it must be accessible from here.
        function buildDomainUncommentedAtomMatchString() {
            // In a hostname domain, an atom in RFC 5322 language corresponds to a label in RFC 1035
            // and RFC 1123 language.
            // Each label may contain dashes, letters, and digits, but cannot start or end with a dash.
            var internalChar = String.raw`[a-zA-Z0-9\-]`;
            var startEndChar = String.raw`[a-zA-Z0-9]`;

            // A label may be up to 63 characters long and cannot be empty. Either a single start/end 
            // char (for a one-character-long label),  or 0-61 internal characters surrounded by
            // start/end chars (for more than one character).
            return '(' + startEndChar + '(' + internalChar + '{0,61}' + startEndChar + ')?)';
        }
        
        
        // Only used by dynamically generated functions.
        function buildUncommentedDomainLiteralMatchString(escapedCharMatchString) {
            // A bracketed literal domain is supposed to be the host's literal address (e.g., an IP address),
            // but according to RFC2282 3.4.1 the only illegal unescaped characters between the brackets are [, ], and \ 
            // (and possibly some control characters).
            // Escaped characters (quoted-pair) are also allowed.
            
            
            // RFC 5322 3.4.1: [CFWS] "[" *([FWS] dtext) [FWS] "]" [CFWS]
            // Don't worry about the CFWS here. That is handled at a higher level.
            return String.raw`(\[(` + fwsMatchString + '?' + buildDtextMatchString(escapedCharMatchString) + ')*' + fwsMatchString + String.raw`?\])`;
            
//            var simpleChar = String.raw`[^[\]\\]`;
//            var simpleOrEscapedChar = makeAlternatives(simpleChar, escapedCharMatchString);
//            return String.raw`(\[` + simpleOrEscapedChar + String.raw`*\])`;
        }


    }
    
    function setOptionDependentValues(opts) {
        // RFC 5322 4.1: obs-NO-WS-CTL = %d1-8 / %d11 / %d12 / %d14-31 / %d127
        // Control characters that do not include carriage return, line feed, or whitespace
        obsNoWsCtlMatchString = String.raw`[\x01-\x08\x0B\x0C\x0E-\x1F\x7F]`;
        
        
        // Escaped characters (quoted-pairs) can occur in unquoted local labels if allowed by options,
        // in comments if comments are allowed, in domain literals, and in quoted strings. Currently,
        // there is always a possibility of having an address part that could contain escaped characters,
        // but if we ever add options to disallow domain literals and to disallow quoted strings, then
        // there would be a combination of options that doesn't allow any escaped characters.
        // RFC 5322 3.2.1: quoted-pair = ("\" (VCHAR / WSP)) / obs-qp
        // The VCHAR definition is taken from RFC5234, and it is simply the set of printing characters.
        if (opts.allowEscapedControlCharacters) {
            // RFC 5322 4.1: obs-qp = "\" (%d0 / obs-NO-WS-CTL / LF / CR)
            // This, combined with the quoted-pair definition, can be simplified as:
            // Quoted-pair is backslash followed by ANYTHING (including control characters, null, bare
            // linefeed, and bare carriage return).
            escapedChar = String.raw`(\\[\s\S])`;
        } else {
            escapedChar = String.raw`(\\` + makeAlternatives(PRINTING_MATCH, WSP_MATCH) + ')';
        }
        
        // RFC 5322 3.2.2: FWS = ([*WSP CRLF] 1*WSP) /  obs-FWS
        // RFC 5322 4.2:   obs-FWS = 1*WSP *(CRLF 1*WSP)
        // If obsolete syntax is disallowed, then FWS is either just at least one WSP, or any 
        // amount of WSP surrounding EXACTLY ONE newline as long as the sequence ends with WSP.
        // The obsolete syntax also allows multiple newlines, as long as the sequence both starts
        // and ends with WSP and each newline is separated by at least one WSP.
        var fwsStrictMatch = '((' + WSP_MATCH + '*' + String.raw`\n)?` + WSP_MATCH + '+)';
        var fwsObsMatch = '(' + WSP_MATCH + String.raw`+(\n` + WSP_MATCH + '+)*)';
        fwsMatchString = opts.allowObsoleteFoldingWhitespace ?
            makeAlternatives(fwsStrictMatch, fwsObsMatch) :
            fwsStrictMatch;
        
        // A comment can contain nested parentheses, and they are supposed to be properly nested/matching.
        // A regex cannot fully verify such a nested syntax. This should not fail any valid
        // address, but it could pass an invalid address with improperly nested parentheses. For full comment
        // validation, we rely on other methods besides the regex.
        if (opts.allowComments) {
            // RFC 5322 3.2.2: comment   = "(" *([FWS] ccontent) [FWS] ")"
            // This means any amount of ccontent and any amount of FWS, as long as there are no
            // two consecutive FWS regions (that can't be merged into a single FWS region).
            
            //                 ccontent  = ctext / quoted-pair / comment
            //                 ctext     = %d33-39 / %d42-91 / %d93-126 / obs-ctext
            // RFC 5322 4.1:   obs-ctext = obs-NO-WS-CTL
            // ctext is any low-ASCII printing character besides parentheses and backslash, plus
            // non-whitespace control characters. If obsolete syntax is disallowed, then control characters
            // are disallowed.
            // Because we can't include the comment definition in ccontent without infinite recursion,
            // we can't convert the specification exactly. In particular, we treat parentheses as ctext.
            var baseCtext = '(' + makeLookahead(String.raw`[^\\]`) + PRINTING_MATCH + ')';
            var ccontent = opts.allowControlCharactersInComments ?
                makeAlternatives(baseCtext, obsNoWsCtlMatchString, escapedChar) :
                makeAlternatives(baseCtext, escapedChar);
                    
            var comment = String.raw`(\((` + fwsMatchString + '?' + ccontent + ')*' + fwsMatchString + String.raw`?\))`;
            
            cfwsMatchString = '(((' + fwsMatchString + '?' + comment + ')+' + fwsMatchString + '?)|' + fwsMatchString + ')';
        }
       
    }
    
    function defineGetResult(returnRegex, shouldCheckComments) {
        if (returnRegex) {
            return function(regex, ignored) {
                return regex;
            };
        } else if (shouldCheckComments) {
            return function(regex, addr) {
                // Do the regex check
                var regexResult = regex.test(addr);
    
                // Do additional non-regex checking for nested comments
                return regexResult && checkComments();
            }
        } else {
            return function(regex, addr) {
                // Do the regex check only
                return regex.test(addr);
            }
        }
    }
    
    function defineBuildFullAddressMatchString(allowLocalAddresses) {
        var fullAddress;
        if (!allowLocalAddresses) {
            return function(lookaheadMatchString, localMatchString, domainMatchString) {
                return lookaheadMatchString + localMatchString + '@' + domainMatchString;
            };
        } else if (allowLocalAddresses > 0) {
            return function(lookaheadMatchString, localMatchString, domainMatchString) {
                return lookaheadMatchString + localMatchString + '(@' + domainMatchString + ')?';
            };
        } else {
            return function(lookaheadMatchString, localMatchString, ignored) {
                return lookaheadMatchString + localMatchString;
            };
        }
    }
    
    function buildLocalPartMatchString(funcs, commentMatchString, escapedCharMatchString) {
        // Retrieve option-dependent function definitions from funcs
        for (var i in funcs) {
            eval('var ' + i +  ' =  funcs[i]');
        }
        
        
        // RFC 5322 3.4.1: local-part = dot-atom / quoted-string / obs-local-part
        
        var atext = getAtextMatchStringForLocal(escapedCharMatchString);
        
        var dotAtom = buildDotAtomMatchString(buildLocalDotAtomTextMatchString(atext), commentMatchString);
        var qString = buildQuotedStringMatchString(escapedCharMatchString, commentMatchString);
        var obsLocalPart = buildObsLocalPartMatchString(atext, escapedCharMatchString, commentMatchString);
        
        return makeAlternatives(dotAtom, qString, obsLocalPart); 
        
        
        // local-part-specific functions:
        function buildLocalDotAtomTextMatchString(atextMatchString) {
            // RFC 5322 3.2.3: dot-atom-text = 1*atext *("." 1*atext)
            // A series of at 1 or more blocks of atext, each at least 1 character long, and each separated
            // by a dot character
            return '(' + atextMatchString + String.raw`+(\.` + atextMatchString + '+)*)';
        }
        
        
    
        
        
        
    }
    
    function defineBuildDomainPartMatchString(canHaveDomain, allowComments) {
        if (!canHaveDomain) {
            // No domain part allowed
            return null;
        }
        
        
        return function(funcs, commentMatchString, escapedCharMatchString) {
            // Retrieve option-dependent function definitions from funcs
            for (var i in funcs) {
                eval('var ' + i +  ' =  funcs[i]');
            }
            
            
            // RFC 5322 3.4.1: domain = dot-atom / domain-literal / obs-domain
            // That is all that RFC 5322 specifies directly, but the hostname is restricted
            // elsewhere, so we can't use the same dot-atom definition as for the local part.
            var dotAtom = buildDotAtomMatchString(buildDomainDotAtomTextMatchString(ATEXT_STRICT_MATCH), commentMatchString);
            var literal = buildDomainLiteralMatchString(escapedCharMatchString, commentMatchString);
            var obsDomain = buildObsDomainMatchString && buildObsDomainMatchString(commentMatchString);
            
            return makeAlternatives(dotAtom, literal, obsDomain);
            
            
            // domain-part-specific functions
            function buildDomainDotAtomTextMatchString() {
                // RFC 5322 3.2.3: dot-atom-text = 1*atext *("." 1*atext)
                // If atom were not allowed to have comments, then this would be equivalent to:
                // atom *("." atom)
                // Fortunately, we have a way of getting a match string for an atom without comments.
                var atom = buildDomainUncommentedAtomMatchString();
                return '(' + atom + String.raw`(\.` + atom + ')*)';
            }
            
            
            
        };
    }
    
    function defineBuildDotAtomMatchString(allowComments) {
        // RFC 5322 3.2.3: dot-atom = [CFWS] dot-atom-text [CFWS]
        if (allowComments) {
            // center=dotAtomTextMatchString, surround=cfwsMatchString
            return surroundWithOptional;
        } else {
            return function(dotAtomTextMatchString) {
                return dotAtomTextMatchString;
            }
        }
    }
    
    
    
    function defineCheckComments(shouldCheckComments, requireNakedAt) {
        if (!shouldCheckComments) return null;
        
        return function() {
            // Strip escaped characters. As far as we're concerned here, any quoted-pair
            // may as well not exist. This will avoid false matches for parentheses within or
            // surrounding comments, as well as for double-quotes outside of comments.
            var strippedAddress = address.replace(/\\[\s\S]/g, '');
            
            var isInQuotedString = false;
            var isInDomainLiteral = false;
            var hasNakedAt = false;
            var commentLevel = 0;
            
            for (var i = 0; i < strippedAddress.length; i++) {
                var ch = strippedAddress[i];
                
                if (isInQuotedString) {
                    // While in a quoted string, the only thing we do is check
                    // for the end of the quoted string (double-quote).
                    isInQuotedString = ch !== '"';
                    continue;
                }
                if (isInDomainLiteral) {
                    // Similar to above. While in a domain literal, just check
                    // for the end of the domain literal (closing square bracket)
                    // and do nothing else.
                    isInDomainLiteral = ch !== ']';
                    continue;
                }
                
                if (commentLevel === 0) {
                    // Outside any comment (unless the current character starts a comment,
                    // which we'll deal with below). This is the only place that a quoted
                    // string or domain literal could start, and it's the only place we could
                    // see a naked @ symbol.
                    if (ch === '@') {
                        hasNakedAt = true;
                        continue;
                    }
                    if (!hasNakedAt && ch === '"') { // Quoted string can only occur in the local part, before the @
                        // Start of a quoted string
                        isInQuotedString = true;
                        continue;
                    }
                    if (hasNakedAt && ch === '[') { // Domain literal can only occur in the domain part, after the @
                        // Start of a domain literal
                        isInDomainLiteral = true;
                        continue;
                    }
                }
                
                // Check for parentheses that increment or decrement the comment level.
                if (ch === '(') {
                    commentLevel += 1;
                } else if (ch === ')') {
                    commentLevel -= 1;
                }
                
                // Properly nested parentheses will NEVER give a negative commentLevel.
                if (commentLevel < 0) return false;
            }
            
            // If parentheses are properly nested, we'll end up with 0 commentLevel. In addition,
            // if each side of the @ sign has separate properly nested parentheses (or no parentheses), 
            // we will have seen a naked @ symbol outside of any comments.
            return commentLevel == 0 && (hasNakedAt || !requireNakedAt);
        };
    }
    
    function defineBuildLengthLookaheadMatchString(allowLocalAddresses) {
        
        
        
        // Local part is 1-64 characters, domain part is at least one character, and total is no longer 
        // than 254 characters (addresses can exist with up to 255 characters in the domain part, total
        // length up to 320 characters, but they can't be used for sending or receiving mail.
        if (!allowLocalAddresses) {
            // Must have local and domain part. Check total length and local length (no need to check
            // domain length because the total length requirement is more strict than the domain length
            // requirement)
            return function(addr) { 
                var totalLengthMatchString = String.raw`[\s\S]{1,254}$`;
                //if (addr.length > 254) return false;
                var partsMatchString = String.raw`[\s\S]{1,64}@[\s\S]{1,255}$`;
                //if (!(/^[\s\S]{1,64}@[\s\S]+$/.test(addr))) return false;
                return makeLookahead(totalLengthMatchString) + makeLookahead(partsMatchString);
                //return true;
            }
        } else if (allowLocalAddresses > 0) {
            // May have local and domain part. Check total length.
            
            // If there is an @ separating the local and domain parts, it must be no later than 
            // the 65th character. If there is not an @, then the entire string must be 1-64 characters
            // long.
            
            return function(addr) {
                var totalLengthMatchString = String.raw`[\s\S]{1,254}$`;
                //if (addr.length > 254) return false;
                var partsMatchString = String.raw`[\s\S]{1,64}(@[\s\S]{1,255})?$`;
                //if (!(/^[\s\S]{1,64}(@[\s\S]+)?$/.test(addr))) return false;
                return makeLookahead(totalLengthMatchString) + makeLookahead(partsMatchString);
                //return true;
            }
        } else {
            // No domain part. Must be no more than 64 characters total.
            
            return function(addr) {
                var totalLengthMatchString = String.raw`[\s\S]{1,64}$`;
                return makeLookahead(totalLengthMatchString);
                //return (addr.length <= 64);
            }
        }
    }
    
    
    

    
    
    
    
    
    
    
    
    
}