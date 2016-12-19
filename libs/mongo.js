;(function() {
    'use strict';

    var mongoose = require('mongoose');
    var config = require('../config');
    var logger = require('./logger').main();

    module.exports = function(app)
    {
        var mongoConfig = config.get('mongo');

        mongoose.Promise = require('bluebird');
    	mongoose.connect(mongoConfig.url);
        mongoose.set('debug', true);
    	var db = mongoose.connection;

    	db.on('error', function(err){
            logger.error('Mongo Connection error:');
            logger.error(err);
            app.emit('db.error', err);
        });
    	db.once('open', function (callback) {
    		logger.info('Mongo OK');
            app.emit('db.connected', db);
    	});

        return mongoose;
    }
}());
