jQuery(function($){

    var app = new App($);

    // load app variables (App.vars());
    app.vars();

    // load onLoad modules  (App.onLoad())
    app.load();

    // load onInit modules  (App.onInit())
    app.init();

});
