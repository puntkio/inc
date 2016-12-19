App.library(function(app, $){

    var UI = function()
    {
        var ui = this;

        ui.jquery = $;
        ui.events = app.events;

        return ui;
    }

    app.ui = new UI();

});
