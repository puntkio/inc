;(function() {
    'use strict';

    var roles = require('../../utils/RolesHelper');

    module.exports = function(role, checkLevels)
    {
        return function(req, res, next) {

            var user = req.user;

            if(!user){
                return res.status(404).send();
            }

            // check if user.role matches role
            // @see utils/RolesHelper
            if(!roles.can(user.role, role, checkLevels)) {
                return res.status(404).send();
            }

            next();
        };
    }

}());
