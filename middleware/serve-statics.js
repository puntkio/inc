;(function() {
    'use strict';

    const path = require('path');
    const express = require('express');

    module.exports = function(app)
    {
        app.use(express.static(path.join(app.basepath, '/public')));
    }
}());
