App.library(function(app, $){

    var Pages = function()
    {
        var pages = {};
        var fn = this;

        fn.set = function(name, id)
        {
            var $page = $(id);
            pages[name] = {element: $page, meta: {name: name}};
            fn.applyVisibility(name);
        };

        fn.get = function(name)
        {
            var page = pages[name] || null;

            if(!page)
                throw new Error("Page not found: "+name);

            return page;
        };

        fn.applyVisibility = function(name)
        {
            var page = fn.get(name);

            if(!page)
                return false;

            if(!page.element.length)
                return false;

            var meta = page.meta;
            var show_once = meta._onShowOnce || [];
            var show = meta._onShow || [];
            var hide = meta._onHide || [];

            if(meta.active)
            {
                page.element.show(50, function(){
                    app.events.emit('pages.show', page.element, meta);
                });

                if(show_once.length)
                {
                    _.remove(show_once, function(cb){
                        cb(page.element, meta);
                        return true;
                    });

                    page.meta._onShowOnce = [];
                }

                if(show.length)
                {
                    _.forEach(show, function(cb){
                        cb(page.element, meta);
                    });
                }

            }
            else
            {
                page.element.hide(50, function(){
                    app.events.emit('pages.hide', page.element, meta);
                });

                if(hide.length)
                {
                    _.forEach(hide, function(cb){
                        cb(page.element, meta);
                    });
                }

            }
        };

        fn.onShowOnce = function(name, callback)
        {
            var page = fn.get(name);

            if(!page.meta._onShowOnce)
                page.meta._onShowOnce = [];

            page.meta._onShowOnce.push(callback);
        };

        fn.onShow = function(name, callback)
        {
            var page = fn.get(name);

            if(!page.meta._onShow)
                page.meta._onShow = [];

            page.meta._onShow.push(callback);
        };

        fn.onHide = function(name, callback)
        {
            var page = fn.get(name);

            if(!page.meta._onHide)
                page.meta._onHide = [];

            page.meta._onHide.push(callback);
        };

        fn.show = function(name)
        {
            var page = fn.get(name);
            page.meta.active = true;
            fn.applyVisibility(name);
        };

        fn.hide = function(name)
        {
            var page = fn.get(name);
            page.meta.active = false;
            fn.applyVisibility(name);
        };

        fn.showOnly = function(name)
        {
            _.forEach(pages, function(page){
                var cname = page.meta.name;

                if(name === cname)
                    fn.show(cname);
                else
                    fn.hide(cname);
            });
        };

        return fn;
    };

    app.pages = new Pages();

});
