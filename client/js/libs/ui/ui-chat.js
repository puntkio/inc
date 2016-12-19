App.onLoad(App.LEVEL_UI, function(app, $){

    var chat = {
        $element: $('.pmw-chat'),
        $btn: $('.show-sidebar[data-target="pmw-chat"]'),
        closed: false,
        counter: 0,
        prevCounter: 0,
    };

    chat.setCounter = function(value)
    {
        var $badge = chat.$btn.find('span');

        chat.counter = value;

        if(chat.counter)
        {
            var txtvalue = (chat.counter < 10) ? chat.counter : "9+";
            $badge.show();
            $badge.addClass('animated');
            $badge.text(txtvalue);
            setTimeout(function(){
                $badge.removeClass('animated');
            }, 2000);
        }
        else {
            $badge.hide();
            $badge.removeClass('animated');
        }
    };

    chat.close = function(persistent)
    {
        chat.$element.addClass('is-hidden');
        chat.closed = true;

        if(persistent)
        {
            chat.persist()
        }
    };

    chat.open = function(persistent)
    {
        chat.$element.removeClass('is-hidden');
        chat.closed = false;

        chat.setCounter(0);

        if(persistent)
        {
            chat.persist();
        }
    };

    // should only close if user didn't set a preference
    // e.g. if user opened the sidebar, this shouldn't close it when called
    chat.shouldClose = function()
    {
        if(chat.persistent && chat.persistent.opened)
            return false;

        chat.close();
    }

    // should only open if user didn't set a preference
    // e.g. if user closed the sidebar, this shouldn't open it when called
    chat.shouldOpen = function()
    {
        if(chat.persistent && chat.persistent.opened)
        {
            chat.open();
        }
    }

    chat.toggle = function()
    {
        if(chat.closed) {
            chat.open();
        } else {
            chat.close();
        }
    };

    chat.persist = function()
    {
        var p = {
            closed: chat.closed,
            opened: !chat.closed
        };
        Cookies.set('_chat', p);
        chat.persistent = p;
    }

    chat.load = function()
    {
        chat.closed = chat.$element.hasClass('is-hidden') ? true : false;

        var cookies = Cookies.getJSON('_chat');

        chat.persistent = cookies;

        if(typeof cookies === 'object')
        {
            chat.closed = cookies.closed;
        }

        if(chat.closed)
            chat.close();
        else
            chat.open();
    }

    chat.load();

    chat.setCounter(0);

    app.ui.chat = chat;
})
