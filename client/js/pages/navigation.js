App.onLoad(function(app, $){

    var $elements = $('[data-page]');

    var navs = {};
    _.forEach($elements, function(nav){
        var page = $(nav).data('page');
        var target = $(nav).data('nav');

        if(navs[page])
            return;

        var $anchor;

        if(target)
        {
            $anchor = $($(nav).find(target));
        }
        else
        {
            $anchor = $(nav);
        }

        $anchor.click(function(){
            $elements.removeClass('current_page');
            $(nav).addClass('current_page');
            app.pages.showOnly(page);
            app.ui.getScrollable('general').update();
        });

    });

});
