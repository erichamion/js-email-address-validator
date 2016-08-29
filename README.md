# js-email-address-validator
Email address validator in JavaScript

This validator will tell with high accuracy whether a given string could possibly be a standard-compliant email address. This is intended to provide validation as strict as possible without failing any valid email address. It was written as a fun challenge.

You likely do not need this amount of validation. Input validation will typically be very simple, such as `/.+@.+/.test(addr)` or `/.+@.+\..+/.test(addr)`. If that basic validation passes, then the address will be fully verified by sending a message to it and wait for the user to respond with some action, which is the only way to truly know whether an address is valid.


## Syntax
```
validateEmailAddress(address[, options])
```

### Parameters
**address**
  The string to check for validity.
  
**options**
  Optional. An object which contains options that affect the validation performed. If an object is supplied and any options are missing, the missing options will be given default values. If nothing is supplied, then all options will be given default values.
  
  Option | Default | Effect
  ------ | ------- | ------
  **useRegexOnly** | **false** | If true, don't do any validation that can't be accomplished using only regular expression matching. In particular, nested comments cannot be properly validated with regular expressions.
  **allowBareEscapes** | **true** | If and only if true, a backslash character can be used to escape normally illegal characters in an unquoted local address label. Backslash escapes can always be used in comments, quoted strings, and bracketed domain literals, regardless of this option.
  **allowComments** | **true** | Allow comments in an address if true, disallow if false.
  **allowLocalAddresses** | **0** | If 0, every address must have a local part, an "@", and a domain part. If positive, then addresses with only a local part (no "@" and no domain part) are allowed in addition to full addresses. If negative, then _only_ addresses with only a local part are allowed, and full addresses are not allowed. The comparisons are not strict, so anything that compares like 0 or false will be considered 0, and true will be considered positive.

```
var addr = 'myaddress@example.com';

if (validateEmailAddress(addr)) {
  alert('Looks good!');
} else {
  alert('Try again, dummy!');
}

if (validateEmailAddress(addr, { useRegexOnly:true })) {
  alert('Looks good!');
} else {
  alert('Try again, dummy!');
}
```


## Rules
The rules for a valid email address are surprisingly complex and are scattered through multiple RFCs. I consulted several sources for the rules and their interpretations.

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
- An email address (in the language of RFC 2822, an addr-spec) contains a local part, followed by "@", followed by a domain part. (This behavior can be modified to either allow or require addresses with _only_ a local part using the allowLocalAddresses option)
- The local part and the domain part are each composed of one or more sections or labels separated by a period.
- No label can be entirely empty, which means that two periods cannot _normally_ appear consecutively (but see below for escaped characters and quoted strings). This also means that neither the local part nor the domain part will start or end with an unescaped period.
- An email address cannot be used if it is more than 254 characters. Longer addresses can exist, but the commands that send and receive mail require a string of 256 characters or less, and that string includes a surrounding pair of angle brackets that takes up two of the 256 characters. This validator will reject any address longer than 254 characters because it cannot be used.
- Backslash Escape: A backslash followed by another character forms a "quoted-pair". This has the effect of escaping the second character in the pair, making it legal where it otherwise would be illegal and removing any special meaning it may have. This is not allowed in all contexts.
- Comment:
  - A label in either the local part or the domain part can start and/or end with comments.
  - According to the validator at isemail.info, multiple comments can appear in succession. (I need to review the RFCs to see whether this is correct, but I've allowed this)
  - A comment is surrounded by parentheses.
  - Valid unescaped characters in a comment are whitespace and any printing character, except for backslash and parentheses (but see the next point).
  - A comment can contain nested comments, each surrounded by parentheses. The parentheses must properly nest and match. **Note:** If the option `useRegexOnly` is true, this cannot be properly validated. In this case, valid comments will be accepted correctly, but some invalid comments will also be accepted.
  - Backslash escapes are allowed inside a comment, and this can be used to insert a parenthesis or backslash.
  - By default, this validator accepts addresses with comments. This behavior can be changed with the `allowComments` option.
- Local Part:
  - The local part can be up to 64 characters long.
  - Normal label: Normally, the legal characters within a label in the local part of the address include alphanumeric low-ASCII characters and the set {``!#$%&'*+-/=?^_`{|}~``}.
  - Quoted string: An entire label (or an entire local part, but then the local part could be considered a single label) can be surrounded in double-quotes. Inside a quoted string, any printable or whitespace character is valid, with the exception of the backslash and the double-quote.
  - Backslash Escape: 
    - Since naked backslash and naked double-quote cannot exist within a quoted string, they can be preceded by a backslash to become a quoted-pair. _This seems to be the only fully agreed upon non-redundant use of the backslash escape in the non-comment portion of a local part._
    - According to RFC 3696, ANY character can be part of a quoted-pair, regardless of whether it must be quoted. (However, quoting/escaping a character that does not need to be quoted is redundant, is unnecessary, is needlessly verbose, and uses more characters than it needs to.)
    - According to RFC 3696,a quoted-pair may occur either within a quoted string or in a normal unquoted label. **Many sources disagree with this interpretation, stating that a quoted-pair MUST be within a quoted string.** By default, this validator follows the rule as given in RFC 3696, allowing backslash escapes anywhere in the local part. This behavior can be changed with the `allowBareEscapes` option.
- Domain Part:
  - The domain part can be either a host name or a domain literal.
  - Domain Literal:
    - A domain literal starts and ends with square brackets.
    - The content between the brackets should be the host's literal location on the network (typically an IP address), but nearly any character is allowed. The only disallowed unescaped characters are square brackets and backslash.
    - Backslash escapes are allowed and can be used to insert a backslash or square bracket.
    - According to the validator at isemail.info, a domain literal can be preceded or followed by comments. (I need to review the RFCs to see whether this is accurate, but I fully expect it is accurate)
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
  - In the domain part, any character above 0x80 is assumed to be a valid alphanumeric character. This **MAY** be correct per IDNA2003 (I haven't checked), but it is certainly **NOT** correct per IDNA2008. IDNA2008 disallows letter variants (capital, full-width/half-width), symbols, and punctuation. As long as the ASCII period (0x2E) is the only valid label/subdomain separator character (again, I haven't checked whether this is true), I don't believe any valid domains would be rejected, but invalid domains could be accepted.
- Comments are included in the overall length of the address, the length of the local part, and the length of the domain part. They are not included in the length of individual labels in the domain. This is probably not the correct handling.


## Future Plans
- Review the RFCs to make sure whitespace and control characters are being handled properly.
- Review how high-ASCII and non-ASCII characters should be treated.
- Add additional options. Future options may include:
  - options for handling (or not handling) internationalized addresses with high-ASCII or non-ASCII characters
  - whether to validate an address or return a regex (or array of regexes if needed). Since the final regex is built up from multiple parts, saving the regex could be more efficient than calling validateEmailAddress() multiple times when checking multiple addresses
  - whether to allow addresses that meet the specification's length requirements but are too long to be used
  - whether to disallow certain things that are legal but discouraged (such as domain literals)
