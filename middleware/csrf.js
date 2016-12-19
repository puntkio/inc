;(function() {
    'use strict';
    
    const csrf = require('csurf');

    module.exports = function(app)
    {
          app.use(csrf());
    }
}());
