function validateEmailAddressFormat(address) {
    // First test: Local part is 1-64 characters, domain part is at least one character, and total
    // is no longer than 254 characters (addresses can exist with up to 255 characters in the domain
    // part, total length up to 320 characters, but they can't be used for sending or receiving mail.
    if (address.length > 254) return false;
    if (!(/^[\s\S]{1,64}@[\s\S]+$/.test(address))) return false;

    // These characters can appear without being escaped or quoted. Don't include the . here, 
    // because it's special (can't be first, last, or consecutive) and handled elsewhere.
    var standardLocalCharSet = String.raw`\`\-a-zA-Z0-9!#$%&'*+/=?^_{|}~\u0080-\uFFFF`;
    var standardLocalChar = new RegExp('[' + standardLocalCharSet + ']');

    // These must be escaped even when inside quotes
    var mustBeEscapedLocalCharSet = String.raw`"\\`;
    var mustBeEscapedLocalChar = new RegExp('[' + mustBeEscapedLocalCharSet + ']');

    // Anything that isn't standard or in mustBeEscaped can be escaped or quoted.
    var mustBeQuotedLocalChar = new RegExp('[^' + standardLocalCharSet + mustBeEscapedLocalCharSet + String.raw`]`);

    // Any character (regardless of whether it needs escaped) can be escaped by a backslash
    var escapedLocalChar = /(\\[\s\S])/;

    // Non-special characters or escaped characters can be in an unquoted section. An unquoted
    // section must be non-zero length.
    var standardLocalSectionChar = new RegExp('(' + standardLocalChar.source + '|' + escapedLocalChar.source + ')');
    var standardLocalSection = new RegExp('(' + standardLocalSectionChar.source + '+)');

    // A quoted section can contain characters legal in a standard section, plus anything
    // in mustBeQuotedLocalChar. The string inside the quotes could be zero length.
    var quotedLocalSectionChar = new RegExp('(' + standardLocalChar.source + '|' + mustBeQuotedLocalChar.source + '|' + escapedLocalChar.source + ')');
    var quotedLocalSection = new RegExp('("' + quotedLocalSectionChar.source + '*")');

    // A comment can contain nested parentheses, and they are supposed to be properly nested/matching.
    // All we're checking is whether there is an outer pair that matches. This should not fail any valid
    // address, but it could pass an invalid address with improperly nested parentheses. We would
    // need to do more than regex checking to fully test comments.
    var comment = /(\([\s\S]*\))/;

    // Any section can be either unquoted (referred to here as standard) or quoted.
    var localSection = new RegExp('(' + standardLocalSection.source + '|' + quotedLocalSection.source + ')');

    //  A section may start and/or end with zero or more comments.
    var commentedLocalSection = new RegExp('(' + comment.source + '*' + localSection.source + comment.source + '*)');

    // Local part can have any number of localSections (optionally with comments), each separated by a single . character.
    var localPart = new RegExp(commentedLocalSection.source + String.raw`(\.` + commentedLocalSection.source + ')*');


    // Each label within a domain can contain dashes, but cannot start or end with a dash.
    // This will fail international non-ASCII domains.
    var domainLabelInternalChar = /[a-zA-Z0-9\-]/;
    var domainLabelStartEndChar = /[a-zA-Z0-9]/;

    // A label contains up to 63 characters. Either a single start/end char (for a one-character-long label), 
    // or 0-61 internal characters surrounded by
    // start/end chars (for more than one character). Alternately phrased, a start/end character, optionally followed by
    // (zero or more internal characters followed by another start/end character).
    var domainLabel = new RegExp('(' + domainLabelStartEndChar.source + '(' + domainLabelInternalChar.source + '{0,61}' + domainLabelStartEndChar.source + ')?)');

    // Like the local part, domain labels can have comments.
    var commentedDomainLabel = new RegExp('(' + comment.source + '*' + domainLabel.source + comment.source + '*)');

    // Domain has ONE or more labels, separated by . chars. (A top-level domain, which has no dots because it
    // is only a single label, is legal).
    var normalDomainPart = new RegExp(commentedDomainLabel.source + String.raw`(\.` + commentedDomainLabel.source + ')*');


    // Domain can also be bracketed. This is supposed to be the host's literal address (e.g., an IP address),
    // but according to RFC2282 3.4.1 the only illegal unescaped characters between the brackets are [, ], and \ 
    // (and possibly some control characters).
    // Escaped characters (quoted-pair) are also allowed.
    var bracketedDomainSimpleChar = /[^[\]\\]/;
    var bracketedDomainChar = new RegExp('(' + bracketedDomainSimpleChar.source + '|' + escapedLocalChar.source + ')');
    var bracketedDomainPart = new RegExp(String.raw`(\[` + bracketedDomainChar.source + String.raw`*\])`);

    var domainPart = new RegExp('(' + normalDomainPart.source + '|' + bracketedDomainPart.source + ')');

    var fullAddress = new RegExp('^' + localPart.source + '@' + domainPart.source + '$');

    return fullAddress.test(address);
}