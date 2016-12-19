;(function() {
    'use strict';

    module.exports = function(mongoose)
    {
        var models = require('model')(mongoose);

        return models;
    }
}());
