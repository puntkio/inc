;(function() {
  'use strict';

  var expressSession = require('express-session');
  var cookieParser = require('cookie-parser');
  var uuid = require('node-uuid');

  module.exports = function(app)
  {
    var config = app.config;
    var logger = app.logger;
    var cookieConfig = config.get('cookie');

    //Setup session middleware
    var cookieObj = { maxAge: 604800000 };
    if(config.inProduction){
      cookieObj.domain = cookieConfig.domain
    }
    var sessionMiddleware = expressSession({
      key: cookieConfig.key,
      genid: function() {
        return uuid.v4();
      },
      secret: cookieConfig.secret,
      proxy: true,
      resave: false,
      store: app.redis.store(),
      saveUninitialized: true,
      cookie: cookieObj
    });
    app.use(sessionMiddleware);
    app.emit("session", sessionMiddleware);
  }

}());
