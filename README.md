# js-email-address-validator
Email address validator in JavaScript

This is intended to provide validation as strict as possible without failing any valid email address. It was written as a fun challenge.

You likely do not need this amount of validation. Input validation will typically be very simple, such as `/.+@.+/.test(addr)` or `/.+@.+\..+/.test(addr)`. If that basic validation passes, then the address will be fully verified by sending a message to it and wait for the user to respond with some action, which is the only way to truly know whether an address is valid.

## Usage
Usage is simple. Call `validateEmailAddress()` with a single string argument. It will return true if the address appears valid, or false otherwise.
```
var addr = 'myaddress@example.com';
if (validateEmailAddress(addr)) {
  alert('Looks good!');
} else {
  alert('Try again, dummy!');
}
```
## Rules
The rules for a valid email address are surprising complex and are scattered through multiple RFCs. I consulted several sources for the rules and their interpretations.

### Sources
- [RFC 3696, Application Techniques for Checking and Transformation of Names](https://tools.ietf.org/html/rfc3696)
- [Errata for RFC 3696](http://www.rfc-editor.org/errata_search.php?rfc=3696)
- [RFC 2822, Internet Message Format](http://www.faqs.org/rfcs/rfc2822.html)
- [RFC 5322, Internet Message Format](http://tools.ietf.org/html/rfc5322)
- [Is this email address valid?](http://isemail.info/about) I have not looked at the code (which is in PHP) for this validator, but I have used the web page to clarify interpretations, and I've read the talking points on the site.
- [Wikipedia article on Email address, Syntax section](https://en.wikipedia.org/wiki/Email_address#Syntax), viewed August 28, 2016
- [Email Validation Rules](http://rumkin.com/software/email.rules.php) at rumkin.com
- [Internationalized Domain Names (IDN) FAQ](http://unicode.org/faq/idn.html)

### Rules followed
- An email address (in the language of RFC 2822, an addr-spec) contains a local part, followed by "@", followed by a domain part.
- The local part and the domain part are each composed of one or more sections or labels separated by a period.
- No label can be entirely empty, which means that two periods cannot _normally_ appear consecutively (but see below for escaped characters and quoted strings). This also means that neither the local part nor the domain part will start or end with an unescaped period.
- An email address cannot be used if it is more than 253 characters. The commands that send and receive mail require a string of 255 characters or less, and that string includes a surrounding pair of angle brackets. This validator will reject any address longer than 253 characters.
- Backslash Escape: A backslash followed by another character forms a "quoted-pair". This has the effect of escaping the second character in the pair, making it legal where it otherwise would be illegal and removing any special meaning it may have. This is not allowed in all contexts.
- Comment:
  - A label in either the local part or the domain part can start and/or end with comments.
  - According to the validator at isemail.info, multiple comments can appear in succession. (I need to review the RFCs to see whether this is correct, but I've allowed this)
  - A comment is surrounded by parentheses.
  - Valid unescaped characters in a comment are whitespace and any printing character, except for backslash and parentheses (but see the next point).
  - A comment can contain nested comments, each surrounded by parentheses. The parentheses must properly nest and match (although the validator doesn't currently test for this).
  - Backslash escapes are allowed inside a comment, and this can be used to insert a parenthesis or backslash.
- Local Part:
  - The local part can be up to 64 characters long.
  - Normal label: Normally, the legal characters within a label in the local part of the address include alphanumeric low-ASCII characters and the set {``!#$%&'*+-/=?^_`{|}~``}.
  - Quoted string: An entire label (or an entire local part, but verification would not be any different) can be surrounded in double-quotes. Inside a quoted string, any printable or whitespace character is valid, with the exception of the backslash and the double-quote.
  - Backslash Escape: 
    - Since naked backslash and naked double-quote cannot exist within a quoted string, they can be preceded by a backslash to become a quoted-pair. _This seems to be the only fully agreed upon non-redundant use of the backslash escape in the non-comment portion of a local part._
    - According to RFC 3696, ANY character can be part of a quoted-pair, regardless of whether it must be quoted. (However, quoting/escaping a character that does not need to be quoted is redundant, is unnecessary, is needlessly verbose, and uses more characters than it needs to.)
    - According to RFC 3696,a quoted-pair may occur either within a quoted string or in a normal unquoted label. **Many sources disagree with this interpretation, stating that a quoted-pair MUST be within a quoted string.** This validator follows the rule as given in RFC 3696, allowing backslash escapes anywhere in the local part.
- Domain Part:
  - The domain part can be either a host name or a domain literal.
  - Domain Literal:
    - A domain literal starts and ends with square brackets.
    - The content between the brackets should be the host's literal location on the network (typically an IP address), but nearly any character is allowed. The only disallowed unescaped characters are _TODO: get this information_.
    - Backslash escapes are allowed.
  - Host Name:
    - Each label within a host name can be up to 63 characters long.
    - The entire host name can be up to 255 characters long, but this would not result in a usable email address.
    - Valid characters within a label are alphanumeric characters and the dash (-).
    - A label cannot start or end with a dash.
    - A label CAN contain multiple consecutive dashes, despite what some sources say.
    - Backslash escapes are not allowed (except in comments).


## Known Limitations
- Does not really handle addresses that contain non-ASCII or high-ASCII characters.
  - In the local part, any character above 0x80 (the start of the high-ASCII range) is assumed to be valid, which seems to be the recommendation.
  - _TODO: Verify that the code actually does this_: In the domain part, any character above 0x80 is assumed to be a valid alphanumeric character. This **MAY** be correct per IDNA2003 (I haven't checked), but it is certainly **NOT** correct per IDNA2008. IDNA2008 disallows letter variants (capital, full-width/half-width), symbols, and punctuation. As long as the ASCII period (0x2E) is the only valid label/subdomain separator character (again, I haven't checked whether this is true), I don't believe any valid domains would be rejected, but invalid domains could be accepted.
- Only partially handles comments. Comments can contain other comments, and the inner parentheses must be properly nested. This cannot be tested with a regular expression. Only the outer parentheses are checked to make sure they match, and the contents of the comment are then ignored. The validator should never reject a valid comment, but it can accept an invalid comment that contains unmatched internal parentheses.
- Comments are included in the overall length of the address, the length of the local part, and the length of the domain part. They are not included in the length of individual labels in the domain. This is probably not the correct handling.


## Future Plans
- Properly validate comments.
- Review the RFCs to make sure whitespace and control characters are being handled properly.
- Add an options parameter. Options may include:
  - whether to allow backslash escapes outside of a quoted string
  - whether to allow comments
  - whether to fully validate comments or only use regex checking
  - whether to validate an address or return a regex (or array of regexes if needed). Since the final regex is built up from multiple parts, saving the regex could be more efficient than calling validateEmailAddress() multiple times when checking multiple addresses
  - whether to allow local addresses that have no domain part
  - whether to allow addresses that meet the specification's length requirements but are too long to be used
  - whether to disallow certain things that are legal but discouraged (such as domain literals)
