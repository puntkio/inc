App.onLoad(App.LEVEL_UI, function(app, $){

    var scrollableElements = {};

    app.ui.getScrollable = function(name)
    {
        return scrollableElements[name] || {};
    }

    app.ui.makeScrollable = function(name, selector) {
        var $element = $(selector)

        if ($element.length > 0) {
            $element.jScrollPane({
                animateScroll: true
            });

            var api = $element.data('jsp');

            var timeout = null;
            handleResize(api, timeout);

            scrollableElements[name] = addScrollable(api, $element);
        }

        return scrollableElements[name] || {};
    }

    var addScrollable = function(api, $element)
    {
        var scrollable = {
            $element: $element,
            api: api,
        };

        scrollable.update = function()
        {
            api.reinitialise();
        };

        scrollable.toBottom = function()
        {
            api.reinitialise();
            api.scrollToBottom(true);
        }

        scrollable.toTop = function()
        {
            api.reinitialise();
            api.scrollToTop(true);
        }

        scrollable.toElement = function(element, sticky)
        {
            api.reinitialise();
            api.scrollToElement(element, sticky, true);
        }

        return scrollable;
    }

    var handleResize = function(api, timeout)
    {
        $(window).bind('resize', function() {
            // IE fires multiple resize events while you are dragging the browser window which
            // causes it to crash if you try to update the scrollpane on every one. So we need
            // to throttle it to fire a maximum of once every 50 milliseconds...
            if (!timeout) {
                timeout = setTimeout(
                    function() {
                        api.reinitialise();
                        timeout = null;
                    },
                    50
                );
            }
        });
    }

});
