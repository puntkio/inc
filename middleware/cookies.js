;(function() {
    'use strict';
    var cookieParser = require('cookie-parser');

    module.exports = function(app)
    {
        var config = app.config.get('cookie');
        app.use(cookieParser(config.secret));        
    }
}());
