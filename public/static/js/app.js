
var App = function(jq)
{
    var fn = this;

    // store jquery instance
    fn.jquery = fn.$ = jq;

    fn.ui = {}

    // store user info
    fn.moderationUser = {};

    _.forEach(App.prototype.__onload, function(cb){
        cb(fn, fn.jquery);
    });

    return fn;
}

App.prototype.__onload = [];
App.prototype.onLoad = function(cb)
{
    App.prototype.__onload.push(cb);
};

var ApiError = function(err, code) {

    this.code = code;
    this.text = null;

    if(_.isObject(err))
    {
        this.code = err.code || err.statusCode || err.status || null;
        this.text = err.text || err.message || err.responseText || err.toString();
    }
    else if(_.isString(err)){
        this.text = err;
    }

    this.toString = function()
    {
        return this.text;
    }
}

var Api = function(app, $) {

    var fn = this;

    // user
    fn.search_user = function(data, cb)
    {
        return _request('POST', 'search', data, cb);
    }

    fn.get_user_bets = function(openId, cb)
    {
        return _request('POST', 'user-bets', {userId: openId}, cb);
    }

    fn.get_user_transactions = function(openId, cb) {
        return _request('GET', 'tables/user/'+openId+'/transactions', {}, cb);
    }

    fn.get_user_transfers = function(openId, cb) {
        return _request('GET', 'tables/user/'+openId+'/transfers', {}, cb);
    }

    var _request = function(method, endpoint, data, cb)
    {
        if(!data)
            data = {};

        if(!data._csrf)
            data._csrf = csrfToken || null;

        if(!cb)
            cb = function(){};

        var xhr = $.ajax({
			type: method,
			url: '/'+endpoint,
			data: data
		});

        xhr.fail(function(err) {
            cb(new ApiError(err));
        })

        xhr.done(function(response) {

            if(!response)
                return cb( new ApiError("empty_response"));

            if(response.err)
                return cb( new ApiError(response.err) );

            if(response.error)
                return cb(new ApiError(response.error));

            if(response.is_error)
                return cb(new ApiError(response.error || response.err || "error"));

            return cb(null, response);
        });


        return xhr;
    }

    return fn;
};

App.prototype.onLoad(function(app, $){
    app.api = new Api(app, $);
});

App.prototype.onLoad(function(app, $){

    var _contentCallbacks = {};

    app.onShowTabContent = function(tab, cb) {

        if(!_contentCallbacks[tab])
            _contentCallbacks[tab] = [];

        _contentCallbacks[tab].push(cb);
    }

    var ranContent = {};
    app.showContent = function(tab)
    {

        var tabs = [
            ".skin-content",
            ".bot-content",
            ".main",
            ".stat-content",
            ".history-content"
        ];

        tabs.forEach(function(ctab){
            if(ctab === tab)
            {
                $(ctab).show();
                if(!ranContent[tab])
                    ranContent[tab] = 0;

                if( _contentCallbacks[tab] && _contentCallbacks[tab].length)
                    _.forEach(_contentCallbacks[tab], function(cb){
                        ranContent[tab] += 1;
                        cb(tab, ranContent[tab]);
                    });
            }
            else
            {
                $(ctab).hide();
            }
        });
    }
})

//Anti-XSS
String.prototype.replaceAll = function(target, replacement) {
    return this.split(target).join(replacement);
};

function escape(target){
    if(!target)
        return target;

    if(typeof target !== "string")
        target = target.toString();

    return target
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll("\"", "&quot;")
        .replaceAll("\'", "&#x27;")
        .replaceAll("\/", "&#x2F;");
}

function stripScripts(s) {
    if(typeof s !== "string")
        s = s.toString();
    var div = document.createElement('div');
    div.innerHTML = s;
    var scripts = div.getElementsByTagName('script');
    var i = scripts.length;
    while (i--) {
      scripts[i].parentNode.removeChild(scripts[i]);
    }
    return div.innerHTML;
  }

function formatBet(value){
    var v = value || 0;
    return v.toLocaleString();
}

function unformatBet(value){
    var v = value || 0;
    return v.replaceAll(",", "").replaceAll(" ", "").replaceAll(".", "");
}

/*

Sample template:

<ul id="my_list_template">
    <li data-id="name"></li>
    <li><span data-id="age"></span></li>
</ul>

var tpl = app.templateObject($('#my_list_template'));

tpl.map({name: "Test", age: "12"});  // should update the template
tpl.clearMapped(); // should clear the data-ids

 // mapping callbacks

var data = {name: "Foobar"};
tpl.map({
    name: function($el){ // $el is the current data-id="name" element;
        $el.addClass('highlight').html(data.name)
    }
})

Template with partials

<table id="my_table_template">
    <thead>
        <tr>
            <th>User</th>
            <th>Age</th>
        </tr>
    </thead>
    <tbody data-id="body">
        <tr data-partial="row">
            <td data-id="user"></td>
            <td data-id="age"></td>
        </tr>
    </tbody>
</table>

var tpl = app.templateObject($('#my_table_template'));

tpl.appendPartial('body', 'row', {user: "User 1", age: "12"});
tpl.appendPartial('body', 'row', {user: "User 2", age: "23"});

tpl.id('body').html(""); // clear the body;

 // or:

var row = tpl.renderPartial('row', {user: "User 1", age: "12"});
$('#my_table_template tbody').append(row);


*/

App.prototype.onLoad(function(app,$){

    app.templateObject = function(text, isPartial){

        var html;

        // text is actually a jquery element
        if(text.context && text[0])
        {
            html = text;
            text = html.html();
        }
        else
        {
            html = $(text);
        }

        var template = {text: text};

        template.$html = html;
        template.mapped = {};

        // try and find all fields in template
        html.find('[data-id]').each(function(el){
            var key = $(this).data('id');
            template.mapped[key] = {elem: $(this), value: ""};
        });

        console.log("INIT", _.size(template.mapped));

        // setup partials

        if(!isPartial)
        {
            template.partials = {};

            html.find('[data-partial]').each(function(){
                var key = $(this).data('partial');
                $(this).removeAttr('data-partial');
                var html = $(this)[0].outerHTML;
                $(this).remove();

                template.partials[key] = html;
            });
        }

        console.log("PRE", _.size(template.mapped));

        template.render = function(data, options)
        {
            if(data)
                template.map(data, html);

            if(options === true)
                options = {html: true};
            else if(!options)
                options = {html: false};

            _.forEach(template.mapped, function(mapped, key){

                var $elem = mapped.elem;
                var value = mapped.value;

                if($elem[0])
                {
                    if(_.isFunction(value))
                    {
                        value = value($elem, key, data);
                    }

                    if(options.partial)
                    {
                        value = template.renderPartial(options.partial, value);
                    }

                    if(html)
                        $elem.html(value);
                    else
                        $elem.text(value);
                }

            });
        }

        template.find = function(selector)
        {
            return template.$html.find(selector);
        }

        template.id = function(id)
        {
            if(template.mapped[id])
            {
                return template.mapped[id].elem;
            }

            var $elem = template.find('#'+id);

            if($elem.length > 0)
                return $elem;

            return template.find('[data-id="'+id+'"]');
        }

        template.clear = function()
        {
            template.clearMapped();

            if(isPartial)
            {
                template.clearBody();
            }

            return template;
        }

        template.map = function(data, html)
        {
            console.log("MAP", _.size(template.mapped));

            if(typeof html === 'undefined')
                html = true;

            if(!data || !_.isObject(data))
                return false;

            _.forEach(data, function(value, key){

                if(template.mapped[key])
                {
                    template.mapped[key].value = value;
                }
            });

            console.log(template.mapped);

            return template;
        }

        template.clearMapped = function()
        {
            _.forEach(template.mapped, function(mapped, key){
                mapped.value = null;
            });

            template.render();

            return template;
        }

        template.remap = function(data, html)
        {
            return template.clearMapped().map(data, html);
        }

        // alias
        template.refresh = template.remap;

        // partials

        template.renderPartial = function(partial, callback)
        {
            if(!template.partials[partial])
            {
                return value;
            }

            var partial = app.templateObject(template.partials[partial], true);

            partial.map(callback);

            return partial.$html;
        };

        template.appendPartial = function(parent, partial, callback)
        {
            var $parent = template.id(parent);
            $parent.append(template.renderPartial(partial, callback));
        }

        template.clearBody = function()
        {
            var $body = template.id('body');
            $body.html("");
        }

        template.bodyPartial = function(partial, callback)
        {
            var $body = template.id('body');
            $body.append(template.renderPartial(partial, callback));
        }

        return template;
    };

})

App.prototype.onLoad(function(app, $){

    $(".main-tab").on('click', function() {
		app.showContent('.main');
	})
	$(".skin-tab").on('click', function() {
		app.showContent('.skin-content');
	})
	$(".stat-tab").on('click', function() {
		app.showContent('.stat-content');
	})
	$(".bot-tab").on('click', function() {
        app.showContent('.bot-content');
	})
    $(".history-tab").on('click', function() {
        app.showContent('.history-content');
	});

});

App.prototype.onLoad(function(app, $){

    var $spinner_transactions = $('.spinner-user-transactions');
    var $spinner_transfers = $('.spinner-user-transfers');
    var $accordion = UIkit.accordion($('#user-accordion'));

    $('#user-transfers').html("");

    $('#user-search').click(function(){
        var data = {
            openId: $("#id64-field").val().trim(),
            referralCode: $("#ref-field").val().trim()
        };

        do_search_user(data);
    });

    $("#bet-refresh").on('click', function(){

        console.log(app.moderationUser);

		if(!app.moderationUser || !app.moderationUser.openId)
			return false;

		if(app.moderationUser.openId) {

            app.api.get_user_bets(app.moderationUser.openId, function(err, response){
                if(err)
                {
                    if(err.code !== 500){
    					toastr.error(err.text);
    				} else {
    					toastr.error("Failed to find Bets");
    				}
                    return false;
                }

                toastr.success("User Bets Found");
				app.ui.user.showBetResults(response);
            });
		}
	})

    function do_search_user(data)
    {
        if(!data.openId && !data.referralCode)
			return;

        app.api.search_user(data, function(err, response){
            if(err)
                return toastr.error("Failed to fetch user");

            app.moderationUser = response.user || {};

            toastr.success("User Found");
            app.ui.user.showSearchResults(response);
        });
    }

    function refresh_user_transactions(cb)
    {
        if(!app.moderationUser || !app.moderationUser.openId)
            return false;

        $spinner_transactions.addClass('uk-icon-spin');

        app.api.get_user_transactions(app.moderationUser.openId, function(err, response){
            if(response.transactions)
            {
                $spinner_transactions.removeClass('uk-icon-spin');
                generateTransactions(response.transactions);
            }
        });
    }

    function refresh_user_transfers(cb)
    {
        if(!app.moderationUser || !app.moderationUser.openId)
            return false;

        $spinner_transfers.addClass('uk-icon-spin');

        app.api.get_user_transfers(app.moderationUser.openId, function(err, response){
            if(response.transfers)
            {
                $spinner_transfers.removeClass('uk-icon-spin');
                generateUserTransfers(response.transfers);
            }
        });
    }

    function accordion_refresh(event,open){

        if(!app.moderationUser || !app.moderationUser.openId)
            return false;

        var refresh_key = false;

        if(event && !open)
            open = event;

        if(open)
        {
            var $open = $(this).find('.uk-accordion-content.uk-active');

            if(!refresh_key)
                refresh_key = $open.data('refresh');

            if(refresh_key === 'refresh_user_transactions') {
                refresh_user_transactions();
            } else if(refresh_key === 'refresh_user_transfers') {
                refresh_user_transfers();
            }
        }
    }

    $spinner_transactions.on('click', function(e){
        e.preventDefault();
        refresh_user_transactions();
        return false;
    });

    $spinner_transfers.on('click', function(e){
        e.preventDefault();
        refresh_user_transfers();
        return false;
    });

    $accordion.on('toggle.uk.accordion', accordion_refresh);

    app.onShowTabContent('.main', function(tab){
        accordion_refresh();
    });

});

App.prototype.onLoad(function(app, $){

    var UserUIController = function()
    {
        var fn = this;
        var resultsTemplate = app.templateObject($('#user_search_results'));
        var betsTemplate = app.templateObject($('#user_bets_results'));
        var betsTableTemplate = app.templateObject($('#user_bets_table'));

        var $btnUserEdit = $('#user-edit');

        fn.showSearchResults = function(results)
        {
            var user = results.user || {};
            var sends = results.sends || [];
            var transactions = results.transactions || [];
            var credits = results.credits || [];

            var userData = generateUser(user);
            var sendsData = generateSendsInfo(user, sends);
            var transactionData = generateTransactionInfo(transactions, credits);

            resultsTemplate.clear();
            betsTemplate.clear();

            resultsTemplate.map(userData).render();
            betsTemplate.map(sendsData).map(transactionData).render();

            $btnUserEdit.show();
        }

        fn.clearSearchResults = function()
        {
            resultsTemplate.clearMapped();
            betsTemplate.clearMapped();
            betsTableTemplate.clear();
            $btnUserEdit.hide();
        }

        fn.showBetResults = function(results)
        {
            var betsData = generateBetsInfo(results);

            betsTemplate.map(betsData).render();
            betsTableTemplate.clear();
            _.forEach(betsData.bet_entries, function(entry){
                betsTableTemplate.bodyPartial('row', {
                    value: '1',
                    color: '2',
                    date: '3',
                });
            })

        }

        fn.clearBetsResults = function()
        {
            betsTemplate.clearMapped();
            betsTableTemplate.clear();
        }

        // helper functions

        fn.user_profile_link = function(user)
        {
            var openid = (typeof user === 'object' && user.openId) ? user.openId : user;

            return $('<a target="_blank"></a>').attr("href","https://steamcommunity.com/profiles/"+openid).text(openid);
        }

        fn.user_tradeurl_link = function(user)
        {
            var tradeurl = (typeof user === 'object' && user.tradeUrl) ? user.tradeUrl : user;
            return $('<a target="_blank"></a>').attr("href",tradeurl).html(escape(tradeurl));
        }

        fn.level = function(user)
        {
            return Math.min(500, Math.floor(user.playedValue/50000))
        }

        fn.muteText = function(user)
        {
            var muteText = "No";

            if(user.muted == 1)
            {
                muteText = "Permanent Mute";
            }
            else if(user.muted == 2)
            {
                muteText = "Mute until ";

                if(user.muteExpire)
                {
                    muteText += user.muteExpire;
                }
                else {
                    muteText = "N/A (Invalid date?)";
                }
            }

            return muteText;
        }


        // private functions

        var generateUser = function(user){

            var resultData = null;

            var extra = {
                'openId': fn.user_profile_link(user),
                'balance': formatBet(user.value),
                'deposit-value': formatBet(user.depositValue),
                'played': formatBet(user.playedValue),
                'level': fn.level(user),
                'collected': formatBet(user.collectedReward),
                'max-bet': formatBet(user.maxBet),
                'ref-code': escape(user.referralCode),
                'tradeUrl': fn.user_tradeurl_link(user.tradeUrl),
                'verified': user.verified ? "True" : "False",
                'withdrawLock': user.withdrawLock ? "True" : "False",
                'tradeLock': user.tradeLock ? "True" : "False",
                'muted': fn.muteText(user),
                'export-bets': function($el) { $el.prop('href', "/export/bets/"+user.openId); },
                'export-sends': function($el) { $el.prop('href', "/export/sends/"+user.openId); }
            };

            resultData = $.extend({}, user, extra);

            return resultData;

        };

        var generateSendsInfo = function(user, sends)
        {
            var sent = 0;
            var recv = 0;
            var totl = 0;

            var out = {};

            _.forEach(sends, function(send){
                var type = (send.destination === user.openId) ? "recv" : "sent";

                if(type === "recv")
                {
                    recv += send.value;
                    totl += send.value;
                }
                else if(type === "sent")
                {
                    sent += send.value;
                    totl -= send.value;
                }
            });

            out.sends_sent = formatBet(sent);
            out.sends_received = formatBet(recv);
            out.sends_total = formatBet(totl);

            return out;
        }

        var generateTransactionInfo = function(transactions, credits){

            var out = {};

    		var deposited = 0;
    		var withdrawn = 0;
    		var skinxCredited = 0;
    		var credited = 0;
    		var depositCredited = 0;
            var skinxRefunded = 0;
            var refunded = 0;
            var depositRefunded = 0;

    		for(var i = 0; i < transactions.length; i++){
    			var transaction = transactions[i];

    			if(transaction.state === "Accepted"){
    				if(transaction.action === "Deposit"){
    					deposited += transaction.value;
    				} else if(transaction.action === "Withdraw"){
    					withdrawn += transaction.value;
    				}
    			}
    		}

    		_.forEach(credits, function(credit){

                if(credit.isRefund || credit.isRefund === undefined) {
                    skinxRefunded += credit.skinxvalue || 0;
        			refunded += credit.value || 0;
        			depositRefunded += credit.depositValue || 0;
                } else {
                    skinxCredited += credit.skinxvalue || 0;
        			credited += credit.value || 0;
        			depositCredited += credit.depositValue || 0;
                }

    		});

    		out.deposited = formatBet(deposited);
    		out.withdrawn = formatBet(withdrawn);
    	    out.credited = formatBet(credited);
    		out.deposit_credited = formatBet(depositCredited);
    		out.refunded = formatBet(refunded);
    		out.deposit_refunded =formatBet(depositRefunded);
    		out.transaction_profit = formatBet(withdrawn - (deposited + depositCredited));

            return out;
    	}

        var generateBetsInfo = function(object){

            var out = {};

    		out.bets = formatBet(object.bets);
    		out.winnings = formatBet(object.winnings);
    		out.bet_profit = formatBet(object.winnings - object.bets);
            out.bet_entries = [];

    		var bets = object.last;

    		for(var i = 0; i < bets.length; i ++) {
    			var bet = bets[i];

    			var value = bet.value;
    			if(bet.type === "in"){
    				value *= -1;
    			}

    			var color = "Gold";
    			if(bet.choice === 0){
    				color = "Gray";
    			} else if(bet.choice === 1){
    				color = "Red";
    			} else if(bet.choice === 2){
    				color = "Blue";
    			}

    			var item = {
                    value: value,
                    color: color,
                    date: moment(bet.date).format('MMMM Do YYYY, h:mm:ss a'),
                };

                out.bet_entries.push(item);
    		}

            return out;

    	}

        return fn;
    }

    app.ui.user = new UserUIController();

});

jQuery(function($){
    var app = new App($);

    // by default, show the main content block;
    app.showContent('.main');

});
