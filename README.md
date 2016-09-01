# js-email-address-validator
Email address validator in JavaScript

This validator will tell with high accuracy whether a given string could possibly be a standard-compliant email address. This is intended to provide validation as strict as possible without failing any valid email address. It was written as a fun challenge.

By default, the validation conforms to RFC 5322. Options can be set to change the validation behavior.

You likely do not need this amount of validation. Input validation will typically be very simple, such as `/.+@.+/.test(addr)`. If that basic validation passes, then the address will be fully verified by sending a message to it and wait for the user to respond with some action, which is the only way to truly know whether an address is valid.


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
  **returnRegex** | **false** | If false, evaluates the address parameter for validity as an email address and returns true or false. If true, ignores the address parameter and returns a regular expression that can be used to check strings for validity as email addresses. Because the final regular expression is built from multiple small parts each time the function is called, saving the returned regular expression may be more efficient when testing multiple addresses. If true, implies `useRegexOnly` is also true.
  **useRegexOnly** | **false** | If true, don't do any validation that can't be accomplished using only regular expression matching. In particular, nested comments cannot be properly validated with regular expressions.
  **allowBareEscapes** | **false** | If and only if true, a backslash character can be used to escape normally illegal characters in an unquoted local address label. Backslash escapes can always be used in comments, quoted strings, and bracketed domain literals, regardless of this option.
  **allowComments** | **true** | Allow comments in an address if true, disallow if false.
  **allowLocalAddresses** | **0** | If 0, every address must have a local part, an "@", and a domain part. If positive, then addresses with only a local part (no "@" and no domain part) are allowed in addition to full addresses. If negative, then _only_ addresses with only a local part are allowed, and full addresses are not allowed. The comparisons are not strict, so anything that compares like 0 or false will be considered 0, and true will be considered positive.
  **separateLocalLabels** | **true** | If true, each dot-separated label in the local part of an address is treated as an individual subunit. This allows for each label to be quoted or unquoted, as well as for each label to be preceded or followed by CFWS. If false, the entire local part is treated as a single unit. The entire local part must be either quoted or unquoted, and CFWS cannot be next to a dot in the local part.

### Return Value
By default, returns a boolean. If the address parameter is a well-formed email address, returns true. Otherwise, returns false.

If the `returnRegex` option is true, returns a regular expression that can be used to test any string for validity as an email address.

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

var addressMatchRegex = validateEmailAddress(null, { returnRegex: true });
if (addressMatchRegex.test(addr)) {
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
- An email address (in the language of RFC 2822 and RFC 5322, an addr-spec) contains a local part, followed by "@", followed by a domain part. (This behavior can be modified to either allow or require addresses with _only_ a local part using the allowLocalAddresses option)
- The local part and the domain part are each composed of one or more sections or labels separated by a period.
- No label can be entirely empty, which means that two periods cannot _normally_ appear consecutively (but see below for escaped characters and quoted strings). This also means that neither the local part nor the domain part will start or end with an unescaped period.
- An email address cannot be used if it is more than 254 characters. Longer addresses can exist, but the commands that send and receive mail require a string of 256 characters or less, and that string includes a surrounding pair of angle brackets that takes up two of the 256 characters. This validator will reject any address longer than 254 characters because it cannot be used.
- Folding Whitespace: Folding whitespace occurs in specific contexts. It consists of any number of space, tab, and/or newline characters, and it always ends with a space or tab. (not fully implemented - some contexts accept any whitespace when they should take folding whitespace)
- Backslash Escape: A backslash followed by another character forms a "quoted-pair". This has the effect of escaping the second character in the pair, making it legal where it otherwise would be illegal and removing any special meaning it may have. This is not allowed in all contexts.
- Comment:
  - According to the validator at isemail.info, multiple comments can appear in succession. (I need to review the RFCs to see whether this is correct, but I've allowed this)
  - A comment is surrounded by parentheses.
  - Valid unescaped characters in a comment are folding whitespace and any printing character, except for backslash and parentheses (but see the next point).
  - A comment can contain nested comments, each surrounded by parentheses. The parentheses must properly nest and match. **Note:** If the option `useRegexOnly` is true, this cannot be properly validated. In this case, valid comments will be accepted correctly, but some invalid comments will also be accepted.
  - Backslash escapes are allowed inside a comment, and this can be used to insert a parenthesis or backslash.
- CFWS:
  - Comment and/or Folding Whitespace
  - A series of one or more comments and/or Folding Whitespace regions
  - A label in either the local part or the domain part can start and/or end with CFWS.
  - By default, this validator accepts addresses with CFWS. This behavior can be changed with the `allowComments` option.
- Local Part:
  - The local part can be up to 64 characters long.
  - Normal label: Normally, the legal characters within a label in the local part of the address include alphanumeric low-ASCII characters and the set {``!#$%&'*+-/=?^_`{|}~``}.
  - Quoted string: An entire label (or an entire local part, but then the local part could be considered a single label) can be surrounded in double-quotes. Inside a quoted string, any printable character or folding whitespace is valid, with the exception of the backslash and the double-quote. Backslash escapes are also allowed withing a quoted string.
  - Backslash Escape: 
    - Since naked backslash and naked double-quote cannot exist within a quoted string, they can be preceded by a backslash to become a quoted-pair. _This seems to be the only fully agreed upon non-redundant use of the backslash escape in the non-comment portion of a local part._
    - ANY character can be part of a quoted-pair, regardless of whether it must be quoted. (However, quoting/escaping a character that does not need to be quoted is redundant, unnecessary, needlessly verbose, and wasteful.)
    - Most sources agree that a backslash escape can occur within a quoted string but not in an unquoted label. RFC 3696 disagrees, stating that a quoted-pair (backslash escape) can occur in either type of label. By default, this validator does **not** allow backslash escapes in unquoted labels. This behavior can be changed using the `allowBareEscapes` option.
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
- Does not handle addresses that contain non-ASCII or high-ASCII characters.
- Comments are included in the overall length of the address, the length of the local part, and the length of the domain part. They are not included in the length of individual labels in the domain. This is probably not the correct handling.


## Future Plans
- RFC 5321 places some restrictions on domain literals. Implement those restrictions.
- RFC 5321 also is more strict on the local part of the address than the rules I followed. Backslash escapes are not allowed in unquoted strings (which I have an option for), a quoted string must be the entire local part (not quoted or unquoted on a label-by-label basis), and I haven't fully reviewed to see if there are other restrictions. Review the RFC and implement these (possibly as options).
  - (On the other hand, this paragraph in RFC 5321 seems to state that backslash escapes can be used outside of quoted strings):
  
  > Note that the backslash, "\", is a quote character, which is used to
  > indicate that the next character is to be used literally (instead of
  >  its normal interpretation).  For example, "Joe\,Smith" indicates a
  >  single nine-character user name string with the comma being the
  >  fourth character of that string.
  
- Review the RFCs to make sure whitespace and control characters are being handled properly.
- Review RFC 6531 and related documents to handle high-ASCII and non-ASCII characters.
- Add additional options. Future options may include:
  - options for handling (or not handling) internationalized addresses with high-ASCII or non-ASCII characters
  - whether to allow addresses that meet the specification's length requirements but are too long to be used
  - whether to disallow certain things that are legal but discouraged (such as domain literals)
  - options to disallow addresses that RFC 5322 considers obsolete


#### Notes for RFC 5321 compatibility
- Does not allow comments. (already an option)
- If the local part has a quoted string, the quoted string must comprise the entire local part. (already an option)
- Unclear about backslash escapes in the local part. The definition only shows quoted-pair as part of quoted-string, but the text implies it can occur elsewhere. (already an option)
- Only ASCII graphic characters and space can be backslash escaped. Other whitespace or control characters, including newline, are not allowed. (could be added)
- Only ASCII graphic characters and space can be in a quoted string. Other whitespace or control characters, including newline are not allowed. (could be added)
- Domain literal must be: (could be added)
   - IPv4 literal: [127.0.0.1]
   - IPv6 literal or general address literal: Inside the brackets, must contain a tag, followed by ':', folowed by other content. The other content cannot be empty and must be printable characters (excluding [, \, and ]).
- There is no mention of backslash escapes in domain literals. (could be added)

#### Notes after reviewing RFC 5322 in more detail
- Printing characters are 0x21-0x7E (!-~)
- WSP = space or horizontal tab
- Comment can contain FWS and/or printable ASCII (excluding parentheses and backslash) -- implemented
- Quoted-string can contain FWS, printable ASCII (excluding double-quote and backslash), and quoted-pair -- implemented
- Quoted strings on a per-label basis are allowed but obsolete -- separateLocalLabels option implements this
- Domain literals can contain FWS and printable ASCII (excluding square brackets and backslash)
- In addition, quoted-pair (backslash escape) and non-whitespace control characters in domain literal are allowed but obsolete. This means every character besides unescaped brackets/backslash is legal, as I've implemented.
- Comments/FWS between period-separated elements of local-part and domain are allowed but obsolete. -- separateLocalLabels option implements this
- Quoted-pair can have non-WS control characters, but this is obsolete.
- Quoted-pair does not seem to be allowed outside of comment and quoted-string (and obsolete in domain literal)