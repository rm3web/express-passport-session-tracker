
exports = module.exports = function(client, middlewareOptions) {
  if (middlewareOptions.logErrors) {
    if (typeof middlewareOptions.logErrors != 'function') {
      middlewareOptions.logErrors = function(err) {
        console.error('Warning: express-passport-session-tracker reported an error: ' + err);
      };
    }
    client.on('error', middlewareOptions.logErrors);
  }

  return function logInInterceptor(req, res, next) {
    var oldLogIn = req.logIn;
    var oldLogOut = req.logOut;
    req.login =
    req.logIn = function(user, options, done) {
      if (typeof options == 'function') {
        done = options;
        options = {};
      }
      oldLogIn.call(req, user, options, function() {
        var passportUser = req.session.passport.user;
        var sessionId = req.sessionID;
        client.sadd('user:' + passportUser, sessionId, function(err) {
          if (err && middlewareOptions.logErrors) {
            middlewareOptions.logErrors(err);
          }
          done();
        });
      });
    };

    req.logout =
    req.logOut = function() {
      var passportUser = req.session.passport.user;
      var sessionId = req.sessionID;
      oldLogOut.call(req);
      client.srem('user:' + passportUser, sessionId , function(err) {
        if (err && middlewareOptions.logErrors) {
          middlewareOptions.logErrors(err);
        }
      });
    };

    next();
  };
};
