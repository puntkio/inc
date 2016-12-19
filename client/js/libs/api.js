var Api = function(app, $) {

    var fn = this;

    // user

    fn.loadUser = function(cb)
    {
        return _request('GET','api/user', {}, cb);
    }

    fn.verifyUser = function(cb)
    {
        return _request('GET','api/user/verify', {}, cb);
    }

    // shop
    fn.loadShop = function(data, cb)
    {
        data = $.extend({
            page: 1,
            category: null,
            sort: null,
            search: null,
        }, data);

        return _request('GET', 'api/shop', data, cb);
    };

    fn.withdrawItems = function(assetIds, cb)
    {
        return _request('POST', 'api/shop/withdraw', {items: JSON.stringify(assetIds)}, cb);
    }

    var _request = function(method, endpoint, data, cb)
    {
        if(!data)
            data = {};

        if(!data._csrf)
            data._csrf = app.csrf || null;

        if(!cb)
            cb = function(){};

        var xhr = $.ajax({
			type: method,
			url: '/'+endpoint,
			data: data,
            dataType: 'json',
		});

        xhr.fail(function(err) {

            if(err.responseText)
            {
                var parsed
                try {
                  parsed = JSON.parse(err.responseText);
                } catch (err) {
                  parsed = false;
                }

                if(parsed)
                {
                    return cb(new ApiError(parsed));
                }
            }

            cb(new ApiError(err));
        });

        xhr.done(function(response) {

            if(!response)
                return cb( new ApiError("empty_response"));

            if(response.err)
                return cb( new ApiError(response.err) );

            if(response.error)
                return cb(new ApiError(response.error));

            if(response.is_error)
                return cb(new ApiError(response.error || response.err || "error"));

            return cb(null, new ApiResponse(response));
        });


        return xhr;
    };

    return fn;
};

var ApiResponse = function(response) {

    return response;

};

var ApiError = function(err, code) {

    this.code = code;
    this.text = null;

    if(_.isObject(err))
    {

        this.code = err.code || err.statusCode || err.status || null;
        this.text = err.text || err.message || err.responseText || err.error || err.toString();
    }
    else if(_.isString(err)){
        this.text = err;
    }

    this.toString = function()
    {
        return this.text;
    };
};

App.onLoad(function(app, $){
    app.api = new Api(app, $);
});
