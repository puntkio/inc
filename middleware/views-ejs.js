;(function() {
    'use strict';
    var engine = require('ejs-locals');
    var path = require('path');

    module.exports = function(app)
    {
        var views_path = path.join(app.basepath,'/views');        
    	app.engine('ejs', engine);
    	app.set('views', views_path);
    	app.set('view engine', 'ejs');
    }
}());
