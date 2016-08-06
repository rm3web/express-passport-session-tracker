exports.queryForSessions = function(client, user, next) {
  client.smembers('user:' + user, next);
};

exports.middleware = require('./lib/middleware.js');
