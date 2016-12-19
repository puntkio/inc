;(function() {
    'use strict';
    var path = require('path');

    module.exports = function(app)
    {
        var views_path = path.join(app.basepath,'/views');

    	app.set('views', views_path);
    	app.set('view engine', 'hjs');
    }
}());
