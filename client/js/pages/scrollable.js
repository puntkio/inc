App.onLoad(function(app, $){

    // setup scrollable content;

    // general scrollable content
    app.ui.makeScrollable('general', '.has-scrolling .pc-inner-wrap');

    // activity feed
    app.ui.makeScrollable('activity-feed', '.sidebar .activity-feed');

    // chat feed
    app.ui.makeScrollable('chat-feed', '.sidebar .chat-feed');


    app.events.on('pages.show', function(event, element, meta){
        console.log('x');
        app.ui.getScrollable('general').update();
    });

});
