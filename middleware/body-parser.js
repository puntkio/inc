;(function() {
    'use strict';

    var bodyParser = require('body-parser');
        
    module.exports = function(app)
    {

        app.use(bodyParser.urlencoded({ extended: true, limit: '50mb' }));
    	app.use(bodyParser.json({ limit: '50mb' }));
    }
}());
