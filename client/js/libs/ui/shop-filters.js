App.onLoad(App.LEVEL_UI, function(app, $){

    var cfilter = null;

    var __initialized = false;

    function ShopFilters()
    {
        var fn = this;

        fn.init = function()
        {
            if(__initialized)
                return false;

            __initialized = true;

            setupElements();
        }

        fn.onApplyFilter = function(cb)
        {
            return app.events.on('shop.apply_filter', cb);
        }

        var setupElements = function()
        {
            $(".filter-selector").click(function() {
                $(".filter-selector").not($(this)).removeClass("active");
                $(this).toggleClass("active");

                if($(this).hasClass('active'))
                    cfilter = $(this).data('name');
                else
                    cfilter = null;
            });
            $(".filter-selector li").click(function() {
                var currentText = $(this).text(),
                    actionToDo = $(this).attr("data-value");
                $(this).parent().find("li").removeClass("current");
                $(this).addClass("current");
                $(this).parent().parent().find("p").text(currentText);

                app.events.emit('shop.apply_filter', {name: cfilter, value: actionToDo});
            });

            $('.search-button').click(function(e){
                e.preventDefault();
                var value = $('.search-text').val();
                app.events.emit('shop.apply_filter', {name: 'search', value: value});
            });

            var timeout = false;
            $('.search-text').keyup(function(e){
                e.preventDefault();
                var value = $('.search-text').val();

                clearTimeout(timeout);
                timeout = setTimeout(function(){
                    app.events.emit('shop.apply_filter', {name: 'autosearch', value: value});
                }, 1000);
            });
        }

        return fn;
    }

    app.ui.shopFilters = new ShopFilters();

})
