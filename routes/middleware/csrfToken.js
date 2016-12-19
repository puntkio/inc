;(function() {
    'use strict';

    // sends csrfToken to view engine as view variable

    module.exports = function(req, res, next) {
        if(!res.locals)
            res.locals = {};

        res.locals.csrfToken = req.csrfToken();

        next();
    };

}());
