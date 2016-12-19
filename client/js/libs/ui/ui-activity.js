App.onLoad(App.LEVEL_UI, function(app, $){

    var activity = {
        $element: $('.pmw-activity'),
        $btn: $('.show-sidebar[data-target="pmw-activity"]'),
        closed: false,
        unseenCounter: 0,
        prevCounter: 0,
        itemsMax: 10,
        itemsMaxCheck: 5,
        items:[],
    };
    var template = app.templateObject($(".activity-feed"));

    activity.setUnseenCounter = function(value)
    {
        var $badge = activity.$btn.find('span');

        activity.unseenCounter = value;

        if(activity.unseenCounter)
        {
            var txtvalue = (activity.unseenCounter < 10) ? activity.unseenCounter : "9+";
            $badge.show();
            $badge.addClass('animated');
            $badge.text(txtvalue);
            setTimeout(function(){
                $badge.removeClass('animated');
            }, 2000);
        } else {
            $badge.hide();
            $badge.removeClass('animated');
        }
    };

    activity.close = function(persist)
    {
        activity.$element.addClass('is-hidden');
        activity.closed = true;

        if(persist)
            activity.persist();
    };

    activity.open = function(persist)
    {
        activity.$element.removeClass('is-hidden');
        activity.closed = false;
        activity.setUnseenCounter(0);

        if(persist)
            activity.persist();
    };

    // should only close if user didn't set a preference
    // e.g. if user opened the sidebar, this shouldn't close it when called
    activity.shouldClose = function()
    {
        if(activity.persistent && activity.persistent.opened)
            return false;

        activity.close();
    }

    // should only open if user didn't set a preference
    // e.g. if user closed the sidebar, this shouldn't open it when called
    activity.shouldOpen = function()
    {
        console.log(activity.persistent);
        if(activity.persistent && activity.persistent.opened)
        {
            activity.open();
        }
    }

    activity.toggle = function()
    {
        if(activity.closed) {
            activity.open();
        } else {
            activity.close();
        }
    };

    activity.renderItem = function (data) {
        var body = template.id('body');

        var partial = template.renderPartial('item', {
            icon: {
                src: data['icon'],
            },
            userName: {
                href: data['user_href'],
                text: data['user_name']
            },
            amount: data['amount'],
            source: data['source']
        });


        body.append(partial);

        app.ui.getScrollable('activity-feed').update();
    };

    activity.addItem = function (data) {
        if( ! _.isObject(data) || ! data['icon'] || ! data['user_name'] || ! data['amount'] || ! data['source']) return;

        if(activity.closed) activity.setUnseenCounter(activity.unseenCounter + 1);

        activity.items.push(data);

        this.renderItem(data);

        if(activity.items.length >= activity.itemsMax) {
            template.id('body').children()[0].remove();
        }
    };

    activity.persist = function()
    {
        var p = {
            closed: activity.closed,
            opened: !activity.closed
        };
        activity.persistent = p;
        Cookies.set('_activity', p);
    }

    activity.load = function()
    {
        activity.closed = activity.$element.hasClass('is-hidden') ? true : false;

        var cookies = Cookies.getJSON('_activity');

        activity.persistent = cookies;

        if(typeof cookies === 'object')
        {
            activity.closed = cookies.closed;
        }

        if(activity.closed)
            activity.close();
        else
            activity.open();
    }

    activity.load();

    activity.closed = activity.$element.hasClass('is-hidden') ? true : false;

    activity.setUnseenCounter(0);

    app.ui.activity = activity;
});
