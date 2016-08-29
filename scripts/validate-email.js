function validateEmailAddressFormat(address, opts) {
    function coalesce(val, def) {
        // Coalesce to default on null or undefined, but not on false/falsey values.
        if (val === undefined || val === null) return def;
        return val;
    }
    
    var checkComments;
    
    // Prevent null reference errors
    opts = opts || {};
    
    // Get options from opts, or specify defaults if not given
    var optUseRegexOnly = coalesce(opts.useRegexOnly, false);
    var optAllowBareEscapes = coalesce(opts.allowBareEscapes, true);
    var optAllowComments = coalesce(opts.allowComments, true);
    var optAllowLocalAddresses = coalesce(opts.allowLocalAddresses, 0); // non-zero = allowed. negative = required. 
    
    
    
    if (optAllowComments && !optUseRegexOnly) {
        checkComments = function(requireAt) {
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
            return commentLevel == 0 && (hasNakedAt || !requireAt);
        };
    }
    
    
    // First test: Local part is 1-64 characters, domain part is at least one character, and total
    // is no longer than 254 characters (addresses can exist with up to 255 characters in the domain
    // part, total length up to 320 characters, but they can't be used for sending or receiving mail.
    if (!optAllowLocalAddresses) {
        // Must have local and domain part. Check total length and local length (no need to check
        // domain length because the total length requirement is more strict than the domain length
        // requirement)
        if (address.length > 254) return false;
        if (!(/^[\s\S]{1,64}@[\s\S]+$/.test(address))) return false;
    } else if (optAllowLocalAddresses > 0) {
        // May have local and domain part. Check total length
        if (address.length > 254) return false;
        
        // If there is an @ separating the local and domain parts, it must be no later than 
        // the 65th character. If there is not an @, then the entire string must be 1-64 characters
        // long.
        if (!(/^[\s\S]{1,64}(@[\s\S]+)?$/.test(address))) return false;
    } else {
        // No domain part. Must be no more than 64 characters total.
        if (address.length > 64) return false;
    }

    // These characters can appear without being escaped or quoted. Don't include the . here, 
    // because it's special (can't be first, last, or consecutive) and handled elsewhere.
    var standardLocalCharSet = String.raw`\`\-a-zA-Z0-9!#$%&'*+/=?^_{|}~\u0080-\uFFFF`;
    var standardLocalChar = '[' + standardLocalCharSet + ']';

    // These must be escaped even when inside quotes
    var mustBeEscapedLocalCharSet = String.raw`"\\`;

    // Anything that isn't standard or in mustBeEscaped can be escaped or quoted.
    var mustBeQuotedLocalChar = '[^' + standardLocalCharSet + mustBeEscapedLocalCharSet + ']';

    // Any character (regardless of whether it needs escaped) can be escaped by a backslash
    var escapedChar = String.raw`(\\[\s\S])`;

    // Non-special characters or escaped characters can be in an unquoted section (or only non-special
    // characters if bare escapes are not allowed). An unquoted section must be non-zero length.
    var standardLocalSectionChar = optAllowBareEscapes ?
        '(' + standardLocalChar + '|' + escapedChar + ')' :
        standardLocalChar;
    var standardLocalSection = '(' + standardLocalSectionChar + '+)';

    // A quoted section can non-special characters legal in a standard section, plus anything
    // in mustBeQuotedLocalChar, plus escaped pairs. The string inside the quotes could be zero length.
    var quotedLocalSectionChar = '(' + standardLocalChar + '|' + mustBeQuotedLocalChar + '|' + escapedChar + ')';
    var quotedLocalSection = '("' + quotedLocalSectionChar + '*")';

    // A comment can contain nested parentheses, and they are supposed to be properly nested/matching.
    // All we're checking is whether there is an outer pair that matches. This should not fail any valid
    // address, but it could pass an invalid address with improperly nested parentheses. We would
    // need to do more than regex checking to fully test comments.
    var comment = String.raw`(\([\s\S]*\))`;

    // Any section can be either unquoted (referred to here as standard) or quoted.
    var localSection = '(' + standardLocalSection + '|' + quotedLocalSection + ')';

    //  A section may start and/or end with zero or more comments, as long as comments are allowed.
    var commentedLocalSection = optAllowComments ?
        '(' + comment + '*' + localSection + comment + '*)' :
        localSection;

    // Local part can have any number of localSections (optionally with comments), each separated by a single . character.
    var localPart = commentedLocalSection + String.raw`(\.` + commentedLocalSection + ')*';


    // Each label within a domain can contain dashes, but cannot start or end with a dash.
    // This will fail international non-ASCII domains.
    var domainLabelInternalChar = String.raw`[a-zA-Z0-9\u0080-\uFFFF\-]`;
    var domainLabelStartEndChar = String.raw`[a-zA-Z0-9\u0080-\uFFFF]`;

    // A label contains up to 63 characters. Either a single start/end char (for a one-character-long label), 
    // or 0-61 internal characters surrounded by
    // start/end chars (for more than one character). Alternately phrased, a start/end character, optionally followed by
    // (zero or more internal characters followed by another start/end character).
    var domainLabel = '(' + domainLabelStartEndChar + '(' + domainLabelInternalChar + '{0,61}' + domainLabelStartEndChar + ')?)';

    // Like the local part, domain labels can have comments if the options don't disallow comments.
    var commentedDomainLabel = optAllowComments ?
        '(' + comment + '*' + domainLabel + comment + '*)' : 
        domainLabel;

    // Domain has ONE or more labels, separated by . chars. (A top-level domain, which has no dots because it
    // is only a single label, is legal).
    var normalDomainPart = commentedDomainLabel + String.raw`(\.` + commentedDomainLabel + ')*';


    // Domain can also be bracketed. This is supposed to be the host's literal address (e.g., an IP address),
    // but according to RFC2282 3.4.1 the only illegal unescaped characters between the brackets are [, ], and \ 
    // (and possibly some control characters).
    // Escaped characters (quoted-pair) are also allowed.
    var bracketedDomainSimpleChar = String.raw`[^[\]\\]`;
    var bracketedDomainChar = '(' + bracketedDomainSimpleChar + '|' + escapedChar + ')';
    var bracketedDomainPart = String.raw`(\[` + bracketedDomainChar + String.raw`*\])`;
    var commentedBracketedDomain = optAllowComments ? 
        '(' + comment + '*' + bracketedDomainPart + comment + '*)' :
        bracketedDomainPart;

    var domainPart = '(' + normalDomainPart + '|' + commentedBracketedDomain + ')';

    var fullAddress;
    if (!optAllowLocalAddresses) {
        fullAddress = localPart + '@' + domainPart;
    } else if (optAllowLocalAddresses > 0) {
        fullAddress = localPart + '(@' + domainPart + ')?';
    } else {
        fullAddress = localPart;
    }
    
    var fullAddressWithEnds = new RegExp('^' + fullAddress + '$');

    var regexResult = fullAddressWithEnds.test(address);
    var fullResult = regexResult && (checkComments ? checkComments(!optAllowLocalAddresses) : true);
    return fullResult;
}