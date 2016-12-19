;(function() {
    'use strict';

    var express = require('express');

    module.exports = function(app)
    {

        // send csrfToken to all views
        app.use(require('./middleware/csrfToken'));
        // send user's role to all views
        app.use(require('./middleware/userRole'));

        // home screen routes like user search
        require('./home')(app);

        // routes related to user moderation (user locks, user mutes, etc)
        require('./moderation')(app);

        // routes related to site locks
        require('./locks')(app);

        // routes related to bots
        require('./bots')(app);

        // tables
        require('./tables')(app);


    }
}());
