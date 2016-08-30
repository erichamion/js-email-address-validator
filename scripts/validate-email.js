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

        // Option-dependent values
        comment,
        escapedChar;
    
    
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
    var localPart = buildLocalPartMatchString(comment, escapedChar);
    var domainPart = buildDomainPartMatchString ? buildDomainPartMatchString(comment, escapedChar) : '';
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
    
    function getOptions(options) {
        // Prevent null reference errors
        var optsWithoutDefaults = options || {};
        // Get options from opts, or specify defaults if not given
        var resultOpts = {
            useRegexOnly: coalesce(optsWithoutDefaults.useRegexOnly, false),
            returnRegex: coalesce(optsWithoutDefaults.returnRegex, false),
            allowBareEscapes: coalesce(optsWithoutDefaults.allowBareEscapes, true),
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
        getResult = buildGetResult(opts.returnRegex, opts.allowComments && !opts.useRegexOnly);
        buildFullAddressMatchString = defineBuildFullAddressMatchString(opts.allowLocalAddresses);
        checkComments = defineCheckComments(opts.allowComments && !opts.useRegexOnly, !opts.allowLocalAddresses);
        buildLengthLookaheadMatchString = defineBuildLengthLookaheadMatchString(opts.allowLocalAddresses);
        buildStandardLocalSectionMatchString = defineBuildStandardLocalSectionMatchString(opts.allowBareEscapes);
        buildLocalSectionMatchString = defineBuildLocalSectionMatchString(opts.allowComments);
        buildDomainPartMatchString = defineBuildDomainPartMatchString(opts.allowLocalAddresses >= 0, opts.allowComments);
        
    }
    
    function setOptionDependentValues(opts) {
        // A comment can contain nested parentheses, and they are supposed to be properly nested/matching.
        // All we're checking is whether there is an outer pair that matches. This should not fail any valid
        // address, but it could pass an invalid address with improperly nested parentheses. We would
        // need to do more than regex checking to fully test comments.
        // We only try to match against comments if the options allow comments.
        comment = opts.allowComments ? String.raw`(\([\s\S]*\))` : '';   
        
        // Escaped characters (quoted-pairs) can occur in unquoted local labels if allowed by options,
        // in comments if comments are allowed, in domain literals, and in quoted strings. Currently,
        // there is always a possibility of having an address part that could contain escaped characters,
        // but if we ever add options to disallow domain literals and to disallow quoted strings, then
        // there would be a combination of options that doesn't allow any escaped characters.
        escapedChar = String.raw`(\\[\s\S])`;
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
        // Local part can have any number of sections (optionally with comments), each separated by a single . character.
        var section = buildLocalSectionMatchString(escapedCharMatchString, commentMatchString);
        return section + String.raw`(\.` + section + ')*';
    }
    
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
        
        function makeLookahead(str) {
            return '(?=' + str + ')';
        }
        
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
    
    function buildQuotedLocalSectionMatchString(standardCharMatchString, mustBeQuotedCharMatchString, escapedCharMatchString) {
        // A quoted section can contain non-special characters legal in a standard section, plus anything
        // in mustBeQuotedChar, plus escaped pairs. The string inside the quotes could be zero length.
        var quotedSectionChar = '(' + standardCharMatchString + '|' + mustBeQuotedCharMatchString + '|' + escapedCharMatchString + ')';
        return '("' + quotedSectionChar + '*")';
    }
    
    function buildLocalUncommentedSectionMatchString(escapedCharMatchString) {
        // These characters can appear without being escaped or quoted. Don't include the . here, 
        // because it's special (can't be first, last, or consecutive) and handled elsewhere.
        var standardCharSet = String.raw`\`\-a-zA-Z0-9!#$%&'*+/=?^_{|}~\u0080-\uFFFF`;
        var standardCharMatchString = '[' + standardCharSet + ']';
        // Characters that can be either quoted or escaped
        var mustBeQuotedCharMatchString = buildMustBeQuotedOrEscapedLocalCharMatchString(standardCharSet);
        
        // Any section can be either standard (unquoted) or quoted.
        var standardSection = buildStandardLocalSectionMatchString(standardCharMatchString, escapedCharMatchString);
        var quotedSection = buildQuotedLocalSectionMatchString(standardCharMatchString, mustBeQuotedCharMatchString, escapedCharMatchString);
        return '(' + standardSection + '|' + quotedSection + ')';

    }
    
    function buildMustBeQuotedOrEscapedLocalCharMatchString(standardLocalCharSet) {
        // These cannot simply be quoted, but must be escaped even when inside quotes
        var mustBeEscapedCharSet = String.raw`"\\`;

        // Anything that isn't standard or in mustBeEscapedCharSet can be either escaped or quoted.
        return '[^' + standardLocalCharSet + mustBeEscapedCharSet + ']';
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
            var internalChar = String.raw`[a-zA-Z0-9\u0080-\uFFFF\-]`;
            var startEndChar = String.raw`[a-zA-Z0-9\u0080-\uFFFF]`;

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