/* eslint-disable node/no-unpublished-require */
var redis = require('redis-mock');
var httpMocks = require('node-mocks-http');
var should = require('chai').should();
require('mocha-steps');
/* eslint-enable node/no-unpublished-require */
var middleware = require('../lib/middleware.js');
var queryForSessions = require('../index.js').queryForSessions;
var events = require("events");

var logInHandler = function(req, res, next) {
  var user = {username: req.body.username, session: req.body.session};
  if (req.body.options) {
    req.logIn(user, {}, function() {
      next();
    });
  } else {
    req.logIn(user, function() {
      next();
    });
  }
};

var logOutHandler = function(req, res, next) {
  req.logOut();
  setTimeout(function() {
    next();
  }, 10);
};

var createMiddlewareMock = function(client, username, session, options, logErrors, done) {
  var body = {username: username,
      session: session};

  if (options) {
    body.options = true;
  }

  var middleWareFunc = middleware(client, {logErrors: logErrors});
  var req  = httpMocks.createRequest(
    {body: body});
  var res = httpMocks.createResponse();

  req.logIn = function(user, options, next) {
    if (typeof options == 'function') {
      done = options;
      options = {};
    }
    this.session = {};
    this.session.passport = {};
    this.session.passport.user = user.username;
    this.sessionID = user.session;
    next();
  };

  req.logOut = function() {
    delete this.session.passport.user;
  };

  middleWareFunc(req, res, function() {
    done(null, req, res);
  });
};

describe('middleware', function() {

  describe('login', function() {
    var req, res;
    var client;
    before(function() {
      client = redis.createClient();
    });

    step('create mock', function(done) {
      createMiddlewareMock(client, 'testuser', 'testsession', false, false, function(err, req2, res2) {
        req = req2;
        res = res2;
        done(err);
      });
    });

    step('login', function(done) {
      logInHandler(req, res, function() {
        done();
      });
    });

    step('check for sessions', function(done) {
      queryForSessions(client, 'testuser', function(err, data) {
        if (err) {
          should.fail();
          return done(err);
        }
        data.should.eql(['testsession']);
        done(err);
      });
    });

    step('create new mock', function(done) {
      createMiddlewareMock(client, 'testuser', 'testsession2', true, false, function(err, req2, res2) {
        req = req2;
        res = res2;
        done(err);
      });
    });

    step('login', function(done) {
      logInHandler(req, res, function() {
        done();
      });
    });

    step('check for sessions', function(done) {
      queryForSessions(client, 'testuser', function(err, data) {
        if (err) {
          should.fail();
          return done(err);
        }
        data.should.eql(['testsession', 'testsession2']);
        done(err);
      });
    });

    step('logout', function(done) {
      logOutHandler(req, res, function() {
        done();
      });
    });

    step('check for sessions', function(done) {
      queryForSessions(client, 'testuser', function(err, data) {
        if (err) {
          should.fail();
          return done(err);
        }
        data.should.eql(['testsession']);
        done(err);
      });
    });

  });

  describe('error', function() {
    var req, res;
    it('logs errors output from redis', function() {
      var errorClient = new events.EventEmitter();
      var middleWareFunc = middleware(errorClient, {});
      try {
        errorClient.emit('error', new Error());
      } catch (e) {

      }
    });

    it('logs errors output from redis via console', function() {
      var errorClient = new events.EventEmitter();
      var middleWareFunc = middleware(errorClient, {logErrors: true});
      errorClient.emit('error', new Error());
    });

    it('logs errors output from redis via funct', function(next) {
      var errorClient = new events.EventEmitter();
      var logFunc = function(err) {
        next();
      };
      var middleWareFunc = middleware(errorClient, {logErrors: logFunc});
      errorClient.emit('error', new Error());
    });
  });

  describe('login and logout error', function() {
    var req, res;
    var client;
    var calledSadd = false;
    var calledSrem = false;
    var logCalls = 0;
    var logFunc = function(err) {
      logCalls = logCalls + 1;
    };

    before(function() {
      client = redis.createClient();
      client.sadd = function(key, value, next) {
        calledSadd = true;
        next(new Error(''));
      };
      client.srem = function(key, value, next) {
        calledSrem = true;
        next(new Error(''));
      };
    });

    step('create mock', function(done) {
      createMiddlewareMock(client, 'testuser', 'testsession', false, logFunc, function(err, req2, res2) {
        req = req2;
        res = res2;
        done(err);
      });
    });

    step('login', function(done) {
      logInHandler(req, res, function() {
        calledSadd.should.equal(true);
        logCalls.should.equal(1);
        done();
      });
    });

    step('logout', function(done) {
      logOutHandler(req, res, function() {
        calledSrem.should.equal(true);
        logCalls.should.equal(2);
        done();
      });
    });
  });
});
