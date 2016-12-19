App.library(function(app, $){

    function Events()
    {
        var fn = this;

        fn.on = function(event, callback)
        {
            return $('body').on(event, callback);
        }

        fn.emit = function(event, arg0,arg1,arg2,arg3)
        {
            return $('body').trigger(event, [arg0,arg1,arg2,arg3]);
        }

        return fn;
    }

    app.events = new Events();

});
