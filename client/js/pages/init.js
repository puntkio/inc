App.onLoad(function(app, $){
    app.pages.set('index',  '#page-index');
    app.pages.set('shop',   '#page-shop');
    app.pages.set('offers', '#page-offers');
    app.pages.set('profile', '#page-profile');
    app.pages.set('support', '#page-help');
    app.pages.set('business-inquiries', '#page-business-inquiries');
    app.pages.set('faq', '#page-faq');
    app.pages.set('tos', '#page-tos');
    app.pages.set('rewards', '#page-rewards');

    app.pages.show('index');

});
