# Express Passport Session Tracker

[![Build Status](https://travis-ci.org/rm3web/express-passport-session-tracker.svg?branch=master)](https://travis-ci.org/rm3web/express-passport-session-tracker)[![dependencies Status](https://david-dm.org/rm3web/express-passport-session-tracker/status.svg)](https://david-dm.org/rm3web/express-passport-session-tracker)[![devDependencies Status](https://david-dm.org/rm3web/express-passport-session-tracker/dev-status.svg)](https://david-dm.org/rm3web/express-passport-session-tracker?type=dev)

If you follow the recommendations for [The OWASP Session Management Cheat Sheet](https://www.owasp.org/index.php/Session_Management_Cheat_Sheet), you'll notice that there's a suggestion that users be able to observe all of their logged in sessions.

[Express-session](https://www.npmjs.com/package/express-session) only really cares about sessions.  A user's account has potentially nothing to do with a session.

[Passport](http://passportjs.org/) requires that you use express-session (or a similar compatible mechanism) but tracking the mapping between session and user is beyond what it can handle at the moment.

This library bridges the gap between the two pieces.  It stores a set data structure in Redis keyed off of the username and stores all of the session ID values as a member of the set.  It collects the data by monkey-patching Passport's logIn and logOut function calls.

## How do I use it?

To attach the middleware
```node
var middleware = require('express-passport-session-tracker').middlware;
var redis = require('redis');
var client = redis.createClient();
var express = require('express');

// Set up an express app
var app = express();

app.use(middleware(client, options));
```

To get a list of sessions:
```node
var queryForSessions = require('express-passport-session-tracker').queryForSessions;

queryForSessions(client, user, function(err, data) {
  if (err) {
    // Handle error
  }
  // data contains the list of sessions as an array
});
```

## Is it fast?

`npm run benchmark`

## Contributing

* `npm run lint` to lint
* `npm run benchmark` to check the benchmarks
* `npm test` to test
* `npm run coverage` to check test coverage

If you've found a bug:
 * Submit away!

If you'd like to submit a PR:
 * I do not expect you to smash multiple commits into a single commit.
 * Unless you say otherwise, I'm assuming "maintainer-fixes" style of merging, where I fix any quibbles and potentially make minor tweaks.  If you specify "maintainer-reviews", I'll maintain a list of things that I've identified for you to change.
 * If you've got a major patch in mind that's larger than an easily-mergable patch, you might consider writing up a blueprint describing what you want to do.

Please note that this project is released with a Contributor Code of Conduct. By participating in this project you agree to abide by its terms -- see [code of conduct](code_of_conduct.md)

## License?

BSD, see LICENSE.txt
