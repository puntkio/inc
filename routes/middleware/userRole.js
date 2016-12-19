;(function() {
    'use strict';

    var roles = require('../../utils/RolesHelper');

    // sends the user's current role to the view engine as a view variable

    module.exports = function(req, res, next) {

        var user = req.user;

        if(!user)
            return next();

        if(!res.locals)
            res.locals = {};

        res.locals.role = roles.findRole(user.role);

        next();
    };

}());
