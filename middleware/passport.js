;(function() {
    'use strict';

    var passport = require('passport');

    module.exports = function(app)
    {
        app.use(passport.initialize());
        app.use(passport.session());

        passport.serializeUser(function(user, done) {
            app.emit('passport.serializeUser', user, done);
        });

        passport.deserializeUser(function(userId, done) {
            console.log("DES", userId);
            app.emit('passport.deserializeUser', userId, done);
        });
    }
}());
