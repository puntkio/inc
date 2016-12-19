var App = function(jq)
{
    var fn = this;

    fn.jquery = jq;

    fn.icon_base = 'https://steamcommunity-a.akamaihd.net/economy/image/';

    var __vars = function(vars)
    {
        _.forEach(vars, function(data, name){
            fn[name] = data;
        });
    }

    fn.vars = function()
    {
        var g = App.__globals;

        if(typeof g === 'function')
        {
            g = g(__vars);
        }

        App.__globals = null;
    };

    fn.load = function()
    {

        var libs = _.sortBy(App.__libs, 'level');

        _.forEach(libs, function(lib){
            lib.cb(fn, fn.jquery);
        });

        // empty __onload after executing all
        App.__onload = [];

    };

    fn.init = function()
    {
        _.forEach(App.__oninit, function(cb){
            cb(fn, fn.jquery);
        });

        // empty __oninit after executing all
        App.__oninit = [];
    };

    return fn;
};

App.LEVEL_GLOBALS = 0;
App.LEVEL_LIBRARY= 10;
App.LEVEL_UI= 20;
App.LEVEL_INIT= 30;
App.LEVEL_LOAD= 40;

App.__globals = {};
App.vars = function(vars)
{
    App.__globals = vars;
};

App.__libs = [];
App.library = function(cb)
{
    App.onLoad(App.LEVEL_LIBRARY, cb);
};

App.onLoad = function(levelOrCallback, callback)
{
    var cb;
    var lvl;

    if(typeof callback === 'undefined' && typeof levelOrCallback === 'function')
    {
        cb = levelOrCallback;
        lvl = App.LEVEL_LOAD;
    }
    else
    {
        cb = callback;
        lvl = levelOrCallback;
    }

    if(!lvl)
    {
        lvl =App.LEVEL_LOAD;
    }

    App.__libs.push({
        level: lvl,
        cb: cb
    });
};

App.__oninit = [];
App.onInit = function(cb)
{
    App.__oninit.push(cb);
};
