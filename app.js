;(function() {
  'use strict';

  const express = require('express');
  const path = require('path');
  const config = require('./config');
  const appLogger = require('./libs/logger');
  const RolesHelper = require('./utils/RolesHelper');

  // setup commander args
  require('./libs/commander')(config);

  let logger = appLogger.main();
  let reqLogger = appLogger.request();

  let app = express();

  // initialize redis, use app as event emitter
  const redis = require('./libs/redis')(app);

  // initialize mongo db
  const mongoose = require('./libs/mongo')(app);

  app.basepath = __dirname;
  app.redis = redis;
  app.logger = logger;
  app.config = config;
  app.mongoose = mongoose;

  app.autoLock = false;

  app.site_locks = {
      bets: false,
      duels: false,
      sends: false,
      autolock: app.autoLock,
  };

  var roles = app.config.get('app.roles');
  RolesHelper.setRoles(roles);

  app.use(require('morgan')("combined", { "stream": reqLogger.stream }));

  // middlewares
  require('./middleware/helmet')(app);
  require('./middleware/views-ejs')(app);
  require('./middleware/body-parser')(app);
  require('./middleware/cookies')(app);
  require('./middleware/serve-statics')(app);
  require('./middleware/session')(app);
  require('./middleware/csrf')(app);
  require('./middleware/passport')(app);

  // event handling
  require('./events/passport_events')(app);
  require('./events/redis_events')(app);

  app.on("session", ()=>{
    logger.debug("session initialized");
  });

  app.on("db.connected", ()=> {

      // initialize models
      app.models = require('./libs/models')(mongoose);

      // initialize routes
      require('./routes')(app);
  })

  module.exports = app;

}());
