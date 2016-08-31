function validateEmailAddressFormat(address, options) {
    
    "use strict";
    
    // Functions that may not be needed or that may have different definitions
    // depending on options:
    var checkComments,
        buildLengthLookaheadMatchString,
        buildStandardLocalSectionMatchString,
        buildLocalSectionMatchString,
        buildDomainPartMatchString,
        buildHostnameMatchString,
        buildDomainLiteralMatchString,
        buildHostnameLabelMatchString,
        buildFullAddressMatchString,
        getResult,
        buildAtomMatchString,
        //buildUncommentedAtomMatchString,
        buildDotAtomMatchString,
        getAtextMatchStringForLocal,
        buildQuotedStringMatchString,

        // Option-dependent values
        escapedChar,
        cfwsMatchString;
    
    // Constants
    var WSP_MATCH = '( |\t)';
    var FWS_STRICT_MATCH = '((' + WSP_MATCH + '*' + String.raw`\n)?` + WSP_MATCH + '+)';
    var FWS_OBS_MATCH = '(' + WSP_MATCH + String.raw`+(\n` + WSP_MATCH + '+)*)';
    var FWS_MATCH = '(' + FWS_STRICT_MATCH + '|' + FWS_OBS_MATCH + ')';
    var PRINTING_MATCH = '[!-~]';
    var ATEXT_STRICT_MATCH = String.raw`[\`\-a-zA-Z0-9!#$%&'*+/=?^_{|}~]`;
    
    
    // Process options and defaults
    var opts = getOptions(options);
    // Prevent unintended use of the bare unprocessed argument
    options = undefined;  
    
    // Assign any functions that depend on options
    defineFunctions(opts);
    setOptionDependentValues(opts);
    
    // Basic length check
    
    // Compose the regex (stored as a string) to match the entire addresss
    var lengthLookaheadPart = buildLengthLookaheadMatchString(address);
    var localPart = buildLocalPartMatchString(cfwsMatchString, escapedChar);
    var domainPart = buildDomainPartMatchString ? buildDomainPartMatchString(cfwsMatchString, escapedChar) : '';
    var fullAddress = buildFullAddressMatchString(lengthLookaheadPart, localPart, domainPart);
    
    // Surround the regex result with start and end markers, so an address must fill the entire string
    var fullAddressWithEnds = new RegExp('^' + fullAddress + '$');
    
    // Compute the final result
    return getResult(fullAddressWithEnds, address);
    
    
    
    
    // Functions that have constant definition:
    
    function coalesce(val, def) {
        // Coalesce to default on null or undefined, but not on false/falsey values.
        if (val === undefined || val === null) return def;
        return val;
    }
    
    function makeLookahead(str, negativeLookAhead) {
        return '(?' + (negativeLookAhead ? '!' : '=') + str + ')';
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
            allowLocalAddresses: coalesce(optsWithoutDefaults.allowLocalAddresses, 0) // non-zero = allowed. negative = required. 
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
    }
    
    function defineFunctions(opts) {
        getAtextMatchStringForLocal = defineGetAtextMatchStringForLocal(opts.allowBareEscapes);
        getResult = buildGetResult(opts.returnRegex, opts.allowComments && !opts.useRegexOnly);
        buildFullAddressMatchString = defineBuildFullAddressMatchString(opts.allowLocalAddresses);
        checkComments = defineCheckComments(opts.allowComments && !opts.useRegexOnly, !opts.allowLocalAddresses);
        buildLengthLookaheadMatchString = defineBuildLengthLookaheadMatchString(opts.allowLocalAddresses);
        buildStandardLocalSectionMatchString = defineBuildStandardLocalSectionMatchString(opts.allowBareEscapes);
        buildLocalSectionMatchString = defineBuildLocalSectionMatchString(opts.allowComments);
        buildDomainPartMatchString = defineBuildDomainPartMatchString(opts.allowLocalAddresses >= 0, opts.allowComments);
        buildAtomMatchString = defineBuildAtomMatchString(opts.allowComments);
        //buildUncommentedAtomMatchString = defineBuildUncommentedAtomMatchString(opts.allowBareEscapes);
        buildDotAtomMatchString = defineBuildDotAtomMatchString(opts.allowComments);
        buildQuotedStringMatchString = defineBuildQuotedStringMatchString(opts.allowComments);
        
    }
    
    function setOptionDependentValues(opts) {
        // A comment can contain nested parentheses, and they are supposed to be properly nested/matching.
        // All we're checking is whether there is an outer pair that matches. This should not fail any valid
        // address, but it could pass an invalid address with improperly nested parentheses. We would
        // need to do more than regex checking to fully test comments.
        // We only try to match against comments if the options allow comments.
        if (opts.allowComments) {
            var commentContent = '(' + FWS_MATCH + '|(' + makeLookahead(String.raw`[^\\]`) + PRINTING_MATCH + '))';
            var comment = String.raw`(\(` + commentContent +  String.raw`*\))`;
            
            cfwsMatchString = '(((' + FWS_MATCH + '?' + comment + ')+' + FWS_MATCH + '?)|' + FWS_MATCH + ')';
        }
        
        // Escaped characters (quoted-pairs) can occur in unquoted local labels if allowed by options,
        // in comments if comments are allowed, in domain literals, and in quoted strings. Currently,
        // there is always a possibility of having an address part that could contain escaped characters,
        // but if we ever add options to disallow domain literals and to disallow quoted strings, then
        // there would be a combination of options that doesn't allow any escaped characters.
        escapedChar = String.raw`(\\[\s\S])`;
       
    }
    
    function defineGetAtextMatchStringForLocal(allowBareEscapes) {
        if (allowBareEscapes) {
            return function(escapedCharMatchString) {
                return '(' + ATEXT_STRICT_MATCH + '|' + escapedCharMatchString + ')';
            };
        } else {
            return function(ignored) {
                return ATEXT_STRICT_MATCH;
            };
        }
    }
    
    function buildGetResult(returnRegex, shouldCheckComments) {
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
    
    function buildLocalPartMatchString(commentMatchString, escapedCharMatchString) {
        // RFC 5322 3.4.1: local-part = dot-atom / quoted-string / obs-local-part
        
        var atext = getAtextMatchStringForLocal(escapedCharMatchString);
        
        var dotAtom = buildDotAtomMatchString(atext, commentMatchString);
        var qString = buildQuotedStringMatchString(escapedCharMatchString, commentMatchString);
        var obsLocalPart = buildObsLocalPartMatchString(atext, escapedCharMatchString, commentMatchString);
        
        return '(' + dotAtom + '|' + qString + '|' + obsLocalPart + ')'; 
        
        
        // Local part can have any number of sections (optionally with comments), each separated by a single . character.
        var section = buildLocalSectionMatchString(escapedCharMatchString, commentMatchString);
        return section + String.raw`(\.` + section + ')*';
    }
    
    function defineBuildDotAtomMatchString(allowComments) {
        // RFC 5322 3.2.3: dot-atom = [CFWS] dot-atom-text [CFWS]
        if (allowComments) {
            return function(atextMatchString, cfwsMatchString) {
                var dotAtomText = buildDotAtomTextMatchString(atextMatchString);
                return '(' + cfwsMatchString + '?' + dotAtomText + cfwsMatchString + '?)';
            };
        } else {
            return buildDotAtomTextMatchString;
        }
    }
    
    function buildDotAtomTextMatchString(atextMatchString) {
        // RFC 5322 3.2.3: dot-atom-text = 1*atext *("." 1*atext)
        // A series of at least 1 blocks of atext, each at least 1 character long, and each separated
        // by a dot character
        return '(' + atextMatchString + String.raw`+(\.` + atextMatchString + '+)*)';
    }
    
    function buildObsLocalPartMatchString(atextMatchString, escapedCharMatchString, cfwsMatchString) {
        // RFC 5322 4.4: obs-local-part = word *("." word)
        var word = buildWordMatchString(atextMatchString, escapedCharMatchString, cfwsMatchString);
        return '(' + word + String.raw`(\.` + word + ')*)';
    }
    
    function buildWordMatchString(atextMatchString, escapedCharMatchString, cfwsMatchString) {
        // RFC 5322 3.2.5: word = atom / quoted-string
        var atom = buildAtomMatchString(atextMatchString, cfwsMatchString);
        var qString = buildQuotedStringMatchString(escapedCharMatchString, cfwsMatchString);
        
        return '(' + atom + '|' + qString + ')';
    }
    
    function defineBuildAtomMatchString(allowComments) {
        // RFC 5322 3.2.3: atom = [CFWS] 1*atext [CFWS]
        
        if (allowComments) {
            return function(atextMatchString, cfwsMatchString) {
//                var bareAtom = buildUncommentedAtomMatchString(atextMatchString);
                return '(' + cfwsMatchString + '?' + atextMatchString + '+' + cfwsMatchString + '?)';
            };
        } else {
            return function(atextMatchString, ignored) {
                return atextMatchString + '+';
            };
        }
    }
    
//    function defineBuildUncommentedAtomMatchString(allowBareEscapes) {
//        // RFC 5322 3.2.3: atom = [CFWS] 1*atext [CFWS]
//        // Must not be empty, contains at least 1 atext character. CFWS is not
//        // handled here.
//        
//        if (allowBareEscapes) {
//            return function(atextMatchString) {
//                return '((' + ATEXT_MATCH + '|' escapedCharMatchString + ')+)';
//            };
//        } else {
//            return function(ignored) {
//                return '(' + ATEXT_MATCH + '+)';
//            };
//        }
//    }
    
    function defineBuildDomainPartMatchString(canHaveDomain, allowComments) {
        if (!canHaveDomain) {
            // No domain part allowed
            return null;
        }
        
        // These only need to be defined if the overall buildDomainPartMatchString is defined.
        buildHostnameMatchString = defineBuildHostnameMatchString(allowComments);
        buildDomainLiteralMatchString = defineBuildDomainLiteralMatchString(allowComments);
        
        return function(commentMatchString, escapedCharMatchString) {
            // A domain can be either a hostname or a bracketed domain literal.
            
            var hostnameMatchString = buildHostnameMatchString(commentMatchString);
            var literalMatchString = buildDomainLiteralMatchString(escapedCharMatchString, commentMatchString);
            return '(' + hostnameMatchString + '|' + literalMatchString + ')';
        };
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
    
    function defineBuildStandardLocalSectionMatchString(allowBareEscapes) {
        // Non-special characters or escaped characters can be in an unquoted section (or only non-special
        // characters if bare escapes are not allowed). An unquoted section must be non-zero length.
        if (allowBareEscapes) {
            return function(standardLocalCharMatchString, escapedCharMatchString) {
                return '((' + standardLocalCharMatchString + '|' + escapedCharMatchString + ')+)';
            };
        } else {
            return function(standardLocalCharMatchString, ignored) {
                return '(' + standardLocalCharMatchString + '+)';
            };
        }
    }
    
    function defineBuildQuotedStringMatchString(allowComments) {
        // RFC 5322 3.2.4: quoted-string = [CFWS] DQUOTE *([FWS] qcontent) [FWS] DQUOTE [CFWS]
        
        if (allowComments) {
            return function(escapedCharMatchString, cfwsMatchString) {
                var baseQuotedString = buildUncommentedQuotedString(escapedCharMatchString);
                return '(' + cfwsMatchString + '?' + baseQuotedString + cfwsMatchString + '?)';
            };
        } else {
            return buildUncommentedQuotedString;
        }
    }
    
    function buildUncommentedQuotedString(escapedCharMatchString) {
        // DQUOTE *([FWS] qcontent) [FWS] DQUOTE
        // qcontent is either qtext or quoted-pair (that is, it's semantically a single character
        // within the quoted string. Note that the quoted string can be empty aside from the
        // surrounding double-quotes.
        var qcontentMatchString = buildQuotableLocalCharMatchString(escapedCharMatchString)
        return '("(' + FWS_MATCH + '?' + qcontentMatchString + ')*' + FWS_MATCH + '?")'
    }
    
    function buildQuotedLocalSectionMatchString(standardCharMatchString, quotableCharMatchString, escapedCharMatchString) {
        // A quoted section can contain non-special characters legal in a standard section, plus anything
        // in mustBeQuotedChar, plus escaped pairs. The string inside the quotes could be zero length.
        var quotedSectionChar = quotableCharMatchString;
        return '("' + quotedSectionChar + '*")';
    }
    
    function buildLocalUncommentedSectionMatchString(escapedCharMatchString) {
        // These characters can appear without being escaped or quoted. Don't include the . here, 
        // because it's special (can't be first, last, or consecutive) and handled elsewhere.
        var standardCharSet = String.raw`\`\-a-zA-Z0-9!#$%&'*+/=?^_{|}~`;
        var standardCharMatchString = '[' + standardCharSet + ']';
        // Characters that can be either quoted or escaped
        var quotableCharMatchString = buildQuotableLocalCharMatchString(escapedCharMatchString);
        
        // Any section can be either standard (unquoted) or quoted.
        var standardSection = buildStandardLocalSectionMatchString(standardCharMatchString, escapedCharMatchString);
        var quotedSection = buildQuotedLocalSectionMatchString(standardCharMatchString, quotableCharMatchString, escapedCharMatchString);
        return '(' + standardSection + '|' + quotedSection + ')';

    }
    
//    function buildMustBeQuotedOrEscapedLocalCharMatchString(standardLocalCharSet) {
    function buildQuotableLocalCharMatchString(escapedCharMatchString) {
//        // These cannot simply be quoted, but must be escaped even when inside quotes
//        var mustBeEscapedCharSet = String.raw`"\\`;
//
//        // Anything that isn't standard or in mustBeEscapedCharSet can be either escaped or quoted.
//        return '[^' + standardLocalCharSet + mustBeEscapedCharSet + ']';
        
        // The above comment is not true. Quoted string can have Folding Whitespace, printing characters
        // (except for " and \), and escaped characters.
        // We don't really care whether a character is also legal outside of quoted strings, so our match string
        // is as simple as that definition (which isn't quite as simple as it might seem).
        var allowedPrintingChars = '(' + makeLookahead(String.raw`["\\]`, true) + PRINTING_MATCH + ')';
        return '(' + FWS_MATCH + '|' + allowedPrintingChars + '|' + escapedCharMatchString + ')';
        
    }
    
    function defineBuildLocalSectionMatchString(allowComments) {
        
        
        if (allowComments) {
            return function(escapedCharMatchString, commentMatchString) {
                var bareSectionMatchString = buildLocalUncommentedSectionMatchString(escapedCharMatchString);
                return '(' + commentMatchString + '*' + bareSectionMatchString + commentMatchString + '*)';
            };
        } else {
            return function(escapedCharMatchString, gnored) {
                return buildLocalUncommentedSectionMatchString(escapedCharMatchString);
            };
        }
    }
    
    function defineBuildHostnameMatchString(allowComments) {
        buildHostnameLabelMatchString = defineBuildHostnameLabelMatchString(allowComments);
        
        return function(commentMatchString) {
            var labelMatchString = buildHostnameLabelMatchString(commentMatchString);

            // Domain has ONE or more labels, separated by . chars. (A top-level domain, which has no dots because it
            // is only a single label, is legal).
            return labelMatchString + String.raw`(\.` + labelMatchString + ')*';
        };
    }
    
    function defineBuildHostnameLabelMatchString(allowComments) {
        if (allowComments) {
            return function (commentMatchString) {
                var bareLabel = buildHostnameUncommentedLabelMatchString();
                return '(' + commentMatchString + '*' + bareLabel + commentMatchString + '*)';
            };
        } else {
            return function(ignored) {
                return buildHostnameUncommentedLabelMatchString();
            }
        }
    }
    
    function buildHostnameUncommentedLabelMatchString() {
        // Each label within a domain can contain dashes, but cannot start or end with a dash.
            // This will fail international non-ASCII domains.
            var internalChar = String.raw`[a-zA-Z0-9\-]`;
            var startEndChar = String.raw`[a-zA-Z0-9]`;

            // A label contains up to 63 characters. Either a single start/end char (for a one-character-long label), 
            // or 0-61 internal characters surrounded by
            // start/end chars (for more than one character). Alternately phrased, a start/end character, optionally followed by
            // (zero or more internal characters followed by another start/end character).
            return '(' + startEndChar + '(' + internalChar + '{0,61}' + startEndChar + ')?)';
    }
    
    function defineBuildDomainLiteralMatchString(allowComments) {
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
    
    function buildUncommentedDomainLiteralMatchString(escapedCharMatchString) {
        // A bracketed literal domain is supposed to be the host's literal address (e.g., an IP address),
        // but according to RFC2282 3.4.1 the only illegal unescaped characters between the brackets are [, ], and \ 
        // (and possibly some control characters).
        // Escaped characters (quoted-pair) are also allowed.
        var simpleChar = String.raw`[^[\]\\]`;
        var simpleOrEscapedChar = '(' + simpleChar + '|' + escapedCharMatchString + ')';
        return String.raw`(\[` + simpleOrEscapedChar + String.raw`*\])`;
    }
    
    
    
}