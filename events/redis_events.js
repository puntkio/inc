;(function() {
    'use strict';

    module.exports = function(app)
    {
        var logger = app.logger;

        app.on("redis.store.connect", function(){
           logger.debug("Using Redis to store sessions...") ;
        });
    }
}());
