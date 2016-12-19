;(function() {
  'use strict';

  const app = require('../app');
  const http = require('http');
  const logger = app.logger;
  const config = app.config;

  if(config.devMode) require("nodejs-dashboard");

  let httpServer = http.createServer(app);
  let port = config.get('port');
  let env = config.get('env');

  httpServer.listen(port);

  httpServer.on('listening', function () {
      logger.info(`Running on port: ${port}`);
      logger.info(`Running in ${env} mode`);
      app.emit("http", httpServer);
  });

  httpServer.on('error', function (error) {
      logger.error(error);
  });

  // We need this to fix CTRL+C under Docker
  process.on('SIGINT', function() {
      process.exit();
  });
}());
