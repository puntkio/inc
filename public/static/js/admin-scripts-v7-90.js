$(function() {
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

	var modal = UIkit.modal("#user-modal");

    var moderationUser = {};

    var _contentCallbacks = {};
    var onShowTabContent = function(tab, cb) {

        if(_contentCallbacks[tab])
            return false;

        _contentCallbacks[tab] = [cb];
    }

    var ranContent = {};
    var showContent = function(tab)
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

	$(".main-tab").on('click', function() {
		showContent('.main');
	})
	$(".skin-tab").on('click', function() {
		showContent('.skin-content');
	})
	$(".stat-tab").on('click', function() {
		showContent('.stat-content');
	})
	$(".bot-tab").on('click', function() {
        showContent('.bot-content');
	})
    $(".history-tab").on('click', function() {
        showContent('.history-content');
	})


    /* store reusable templates here
     currently used for history table
     access with
        var template = jqTemplates.history_row.clone();
        template.find('.td-action').html("Deposit");
        $('.container').append(template);
    */
    var jqTemplates = {};
    $.each($('.jqTemplate'), function(k,tpl){
        var id = $(tpl).attr('id');
        var html = $(tpl).clone(false);
        html.attr("id", "").removeClass("jqTemplate");
        $(tpl).remove();
        jqTemplates[id] = html;
    });

	// $("#bot-lock").on('click', function(){
	// 	$.ajax({
	// 		type: 'GET',
	// 		url: '/lock'
	// 	}).done(function(response) {
	// 		UIkit.notify({
	// 			message : "Bots have been locked",
	// 			status	: 'success',
	// 			timeout : 5000,
	// 			pos		 : 'top-right'
	// 		});
	// 	}).error(function(error){
	// 		if(error.status !== 500){
	// 			UIkit.notify({
	// 				message : error.responseText,
	// 				status	: 'danger',
	// 				timeout : 5000,
	// 				pos		 : 'top-right'
	// 			});
	// 		} else {
	// 			UIkit.notify({
	// 				message : "Failed to lock bots",
	// 				status	: 'danger',
	// 				timeout : 5000,
	// 				pos		 : 'top-right'
	// 			});
	// 		}
	// 	});
	// });

	// $("#bot-unlock").on('click', function(){
	// 	$.ajax({
	// 		type: 'GET',
	// 		url: '/unlock'
	// 	}).done(function(response) {
	// 		UIkit.notify({
	// 			message : "Bots have been unlocked",
	// 			status	: 'success',
	// 			timeout : 5000,
	// 			pos		 : 'top-right'
	// 		});
	// 	}).error(function(error){
	// 		if(error.status !== 500){
	// 			UIkit.notify({
	// 				message : error.responseText,
	// 				status	: 'danger',
	// 				timeout : 5000,
	// 				pos		 : 'top-right'
	// 			});
	// 		} else {
	// 			UIkit.notify({
	// 				message : "Failed to unlock bots",
	// 				status	: 'danger',
	// 				timeout : 5000,
	// 				pos		 : 'top-right'
	// 			});
	// 		}
	// 	});
	// });

	$("#user-edit").on('click', function() {
		$('#credit-skinxvalue-field').val("");
		$('#credit-value-field').val("");
		$('#credit-deposit-field').val("");
		$('#credit-is-refund').prop('checked','checked');
		var username = $('#username').html();
		$("#modal-user").text("- " + escape(username));
        update_user_edit_ui();
	});

	$(document).on('click', '.item', function() {
		var name = $($(this).children()[0]).text();
		var price = $($(this).children()[1]).children().text();
		$("#modal-skin").text("");
		$('#price-adjust-field').val("");
		$('#price-adjust-field').val(unformatBet(price));
		$("#modal-skin").text(stripScripts(name));
		var modal = UIkit.modal("#price-modal");
		modal.show();
	});

	$("#skin-search").on('submit', function(e){
		e.preventDefault()
		term = $("#skin-search-name").val();
		$.ajax({
			type: 'POST',
			url: '/search-skins',
			data: {
				filter: term,
				_csrf: csrfToken
			}
		}).done(function(response) {
			toastr.success("Skins Loaded");
			skinResults(response);
		}).error(function(error){
			if(error.status !== 500){
				toastr.error(error.responseText);
			} else {
				toastr.error("Failed to search Skins");
			}
		});
	})

	$("#price-submit-form").on('submit', function(e){
		e.preventDefault()
	})

	$("#price-submit").on('click', function(){
		var itemName = $("#modal-skin").text();
		var value = $('#price-adjust-field').val();
		$.ajax({
			type: 'POST',
			url: '/edit-skins',
			data: {
				name: itemName,
				value: value,
				_csrf: csrfToken
			}
		}).done(function(response) {
			toastr.success(itemName + " has been adjusted to " + value + " Bux");
		}).error(function(error){
			if(error.status !== 500){
				toastr.error(error.responseText);
			} else {
				toastr.error("Failed to adjust price");
			}
		});
	});

	function skinResults(skins) {

		$("#price-table").empty();

		for(var i = 0; i < skins.length; i ++) {
			var skin = skins[i];
			var item = "";
			item += '<tr class="item">';
			item += '<td>' + escape(skin.name) + '</td>';
			item += '<td><a href="https://steamcommunity.com/market/listings/730/'+encodeURIComponent(skin.name)+'" target="_blank>">'+skin.name+' SCM</a></td>';
			item += '<td><span class="price">' + formatBet(skin.value) + '</span></td>';
			item += '</tr>';
			$("#price-table").append(item);
		}
	}

	$("#clear-tradelock").on('click', function(){
		var openId = $('#openId').text();
		$.ajax({
			type: 'POST',
			url: '/trade-unlock',
			data: {
				openId: openId,
				_csrf: csrfToken
			}
		}).done(function(response) {
			toastr.success(openId + " has been Trade Unlocked");
		}).error(function(error){
			if(error.status !== 500){
				toastr.error(error.responseText);
			} else {
				toastr.error("Failed clear Trade Locks");
			}
		});
	});

	$("#mute").on('click', function(){
		var openId = $('#openId').text();
		$.ajax({
			type: 'POST',
			url: '/mute',
			data: {
				openId: openId,
				_csrf: csrfToken
			}
		}).done(function(response) {
			toastr.success(openId + " has been muted");
            if(moderationUser)
            {
                moderationUser.muted = 1;
                update_user_edit_ui();
            }
		}).error(function(error){
			if(error.status !== 500){
				toastr.error(error.responseText);
			} else {
				toastr.error("Failed to mute user");
			}
		});
	});

	$("#unmute").on('click', function(){
		var openId = $('#openId').text();
		$.ajax({
			type: 'POST',
			url: '/unmute',
			data: {
				openId: openId,
				_csrf: csrfToken
			}
		}).done(function(response) {
			toastr.success(openId + " has been unmuted");
            if(moderationUser)
            {
                moderationUser.muted = 0;
                update_user_edit_ui();
            }
		}).error(function(error){
			if(error.status !== 500){
				toastr.error(error.responseText);
			} else {
				toastr.error("Failed to unmute user");
			}
		});
	});

	$("#withdraw-lock").on('click', function(){
		var openId = $('#openId').text();
		$.ajax({
			type: 'POST',
			url: '/withdrawLock',
			data: {
				openId: openId,
				_csrf: csrfToken
			}
		}).done(function(response) {
			toastr.success(openId + " has been withdraw locked");
		}).error(function(error){
			if(error.status !== 500){
				toastr.error(error.responseText);
			} else {
				toastr.error("Failed to withdraw lock user");
			}
		});
	});

	// $("#withdraw-unlock").on('click', function(){
	// 	var openId = $('#openId').text();
	// 	$.ajax({
	// 		type: 'POST',
	// 		url: '/withdrawUnlock',
	// 		data: {
	// 			openId: openId,
	// 			_csrf: csrfToken
	// 		}
	// 	}).done(function(response) {
	// 		toastr.success(openId + " has been withdraw unlocked");
	// 	}).error(function(error){
	// 		if(error.status !== 500){
	// 			toastr.error(error.responseText);
	// 		} else {
	// 			toastr.error("Failed to withdraw unlock user");
	// 		}
	// 	});
	// });

    $(".user-lock-button").on('click', function(){

        if(!moderationUser || !moderationUser.openId)
        {
            toastr.error("Cannot determine target user. Search user again using form");
            return false;
        }

        var id = $(this).attr('id');
        var parts = id.split('-');

        var target = parts[0];
        var action = parts[1];

		$.ajax({
			type: 'POST',
			url: '/moderate/user-lock',
			data: {
				userOpenId: moderationUser.openId,
                target: target,
                action: action,
				_csrf: csrfToken
			}
		}).done(function(response) {
            if(response.field && response.value >= 0)
            {
                moderationUser[response.field] = response.value;
                update_user_edit_ui();
            }
        }).error(function(err){
            console.log(err);
            if(err.status !== 500){
				toastr.error(err.responseText);
			} else {
				toastr.error("Failed to execute user lock action: "+action+" target: "+target);
			}
		});
	});

	$(document).on('submit', '#credit-submit', function(event){
		event.preventDefault();
		var openId = $('#openId').text();
		var skinxvalue = parseInt($('#credit-skinxvalue-field').val());
		var value = parseInt($('#credit-value-field').val());
		var deposit = parseInt($('#credit-deposit-field').val());
        var is_refund = $('#credit-is-refund').is(":checked");

		if(isNaN(skinxvalue)){
			skinxvalue = 0;
		}
		if(isNaN(value)){
			value = 0;
		}
		if(isNaN(deposit)){
			deposit = 0;
		}
        var savedata = {
            openId: openId,
            skinxvalue: skinxvalue,
            value: value,
            depositValue: deposit,
            _csrf: csrfToken
        };

        if(is_refund)
        {
            savedata.isRefund = true;
        }

		$.ajax({
			type: 'POST',
			url: '/credit',
			data: savedata,
		}).done(function(response) {
			toastr.success("Credited skinx value of " + skinxvalue + " with value of " + value + " and deposit value of " + deposit + " to " + openId);
			$('#credit-skinxvalue-field').val("");
			$('#credit-value-field').val("");
			$('#credit-deposit-field').val("");
			$('#credit-is-refund').prop('checked', true);

            if(response.notes && moderationUser)
            {
                update_user_notes(response.notes)
            }

		}).error(function(error){
			if(error.status !== 500){
				toastr.error(error.responseText);
			} else {
				toastr.error("Failed to credit User");
			}
		});
	});

    // user notes

    // Moderate user notes
    $('#user-add-note').click(function(){
        $('#user-note-content').val("");
        $('#user-add-note').addClass('uk-hidden');
        $('#user-note').removeClass('uk-hidden');
    });

    $('#user-cancel-note').click(function(){
        $('#user-note-content').val("");
        $('#user-add-note').removeClass('uk-hidden');
        $('#user-note').addClass('uk-hidden');
    });

    $('#user-save-role').click(function(){
        var data = {
            openId: moderationUser.openId,
            new_role: $('#user-new-role').val(),
            old_role: moderationUser.role,
            _csrf: csrfToken
        };

        $.ajax({
            url: '/moderate/change-role',
            method: 'POST',
            data: data,
            dataType: "json",
        }).done(function(data) {

            if(data.new_role)
            {
                update_user_role(data.new_role);
            }

            if(data.notes)
            {
                update_user_notes(data.notes);
            }

        });
    });

    $('#user-save-note').click(function(){

        var data = {
            openId: moderationUser.openId,
            note: escape($('#user-note-content').val()),
            _csrf: csrfToken
        };

        $.ajax({
            url: '/moderate/add-note',
            method: 'POST',
            data: data,
            dataType: "json",
        }).done(function(data) {
            console.log(data);
            if(data.openId === moderationUser.openId)
            {
                if(typeof moderationUser === 'object')
                {
                    update_user_notes(data.notes);
                }

                $('#user-add-note').removeClass('uk-hidden');
                $('#user-note').addClass('uk-hidden');
                $('#user-note-content').val("");
            }
        });
    });

    function update_user_edit_ui()
    {
        if(!moderationUser)
            return false;

        $('.user-lock-button').removeClass('uk-button-success').removeClass('uk-button-danger');
        $('#mute').removeClass('uk-button-danger');
        $('#unmute').removeClass('uk-button-success');

        if(moderationUser.muted > 0)
            $('#mute').addClass('uk-button-danger');
        else
            $('#unmute').addClass('uk-button-success');

        if(moderationUser.withdrawLock)
            $('#withdraws-lock').addClass('uk-button-danger');
        else
            $('#withdraws-unlock').addClass('uk-button-success');

        if(moderationUser.depositLock)
            $('#deposits-lock').addClass('uk-button-danger');
        else
            $('#deposits-unlock').addClass('uk-button-success');

        if(moderationUser.lockedDuels)
            $('#duels-lock').addClass('uk-button-danger');
        else
            $('#duels-unlock').addClass('uk-button-success');

        if(moderationUser.lockedBets)
            $('#bets-lock').addClass('uk-button-danger');
        else
            $('#bets-unlock').addClass('uk-button-success');

        if(moderationUser.sendLock)
            $('#sends-lock').addClass('uk-button-danger');
        else
            $('#sends-unlock').addClass('uk-button-success');
    }

    function update_user_role(role)
    {
        var urole = "Regular";

        if(!role)
            role = "regular";

        if(role === "admin") urole = "Admin (has full admin access)";
        else if(role === "mod") urole = "Moderator (has limited admin access)";
        else if(role === "chatmod") urole = "Chat Moderator (Blue Name)";
        else if(role === "veteran") urole = "Veteran User (Gold Name)";
        else if(role === "regular") urole = "Regular User (White Name)";

        $('#current-role strong').html(urole);

        $('#user-new-role').val(role);

        if(moderationUser)
            moderationUser.role = role;
    }

    function update_user_notes(notesList, target)
    {
        if(!target)
            target = '#user-notes';

        $(target).html("");
        if(notesList && notesList.length > 0)
        {
            var notes = notesList.reverse();
            var template = "<li><div class='author'><strong class='name'></strong> wrote on <strong class='date'></strong>:</div><div class='note'></div></li>";
            $.each(notes, function(idx,note){
                var $note = $(template);
                var d = new Date(note.date);
                var date = d.toString() || "Unknown";
                $note.find('.author .name').html(escape(note.author_name));
                $note.find('.author .date').html(date);
                $note.find('.note').html("<p>"+escape(note.note)+"</p>");
                $(target).append($note);
            });
        }
    }


	$('#stats-refresh').on('click', function(){
		$.ajax({
			type: 'POST',
			url: '/stats',
			data: {
				_csrf: csrfToken
			}
		}).done(function(response) {

			toastr.success("Refreshed");

			generateStats(response.stats, response.skins, response.credits);
		});
	});

    onShowTabContent('.bot-content', function(tab, ran){

        if(ran > 1)
            return false;
        // Service Page
        // .bot-content code

        var bot_list = {};
        var locks_status = {};
        var $table = $('#bot-list-table')
        $('#bots-refresh-list').click(function(){
            load_bots_list();
        });

        $('#bots-refresh-inventory').click(function(){
            refresh_bots_inventories(function(){
                setTimeout(function(){
                    load_bots_list();
                }, 3000);
            });
        });

        $('#btn-locks-refresh').click(function(){
            refresh_locks();
        });

        $('.save-settings').click(function(){
            var settingName = $(this).data('id');
            var settingValue = $('#'+settingName).val();
            var isList = parseInt($(this).data('list')) > 0 ? true : false;

            if(isList)
            {
                settingValue = _.remove(settingValue.split("\n"), function(n){
                    return n.length > 0;
                });
            }

            saveSettings([{
                name: settingName,
                value: settingValue,
            }]);
        });

        loadSettings(function(settings){
            _.forEach(settings, function(value, name){
                var $elem = $('#'+name);
                if(!$elem[0])
                    return;

                var target = $elem[0];

                if(target.localName === 'textarea')
                {
                    var content = _.join(value,"\n\n");
                    $elem.text(content);
                }
            });
        });

        function loadSettings(cb)
        {
            if(!cb)
                cb = function(){};

            $.ajax({
                type: 'GET',
                dataType: 'json',
                url: '/settings',
            }).done(function(result){

                var settings = {};

                _.forEach(result.settings, function(r){
                    settings[r.name] = r.value;
                });

                cb(settings);
            });
        }

        function saveSettings(settingsList)
        {
            var sdata = {
                _csrf: csrfToken,
                settings: settingsList
            };

            $.ajax({
                type: 'POST',
                dataType: 'json',
                url: '/settings',
                data: sdata,
            }).done(function(response){
                toastr.success("Saved Settings");
                console.log("Saved!");
            });
        }

        function refresh_bots_inventories(cb)
        {
            if(typeof cb !== 'function')
                cb = function(){};

            $.ajax({
    			type: 'GET',
                dataType: 'json',
    			url: '/bots/refresh',
    			data: {
    				_csrf: csrfToken
    			}
    		}).done(function(response) {

                if(response.error) {
                    toastr.error(response.error);
                } else if(!response.sent) {
                    toastr.error("Refresh signal not sent!");
                } else {
                    toastr.success("Refresh signal sent. Refresh the list in a few seconds...");
                }
                cb(response);
    		});
        };

        function load_bots_list(cb)
        {
            if(typeof cb !== 'function')
                cb = function(){};

            $.ajax({
    			type: 'GET',
                dataType: 'json',
    			url: '/bots',
    			data: {
    				_csrf: csrfToken
    			}
    		}).done(function(response) {

                if(response.error) {
                    toastr.error(response.error);
                } else if(!response.bots) {
                    toastr.error("Invalid bots result!");
                } else {
                    bot_list = response.bots;
                    fill_bot_content_table();
                    toastr.success("Refreshed Bots List");
                }
                cb(response);
    		});
        }

        function fill_bot_content_table(data)
        {
            if(!data)
                data = bot_list;

            if(!data || !data.length)
            {
                console.error("Invalid data or data length");
                return false;
            }

            var rowTemplate = jqTemplates.bot_row;

            $('#bot-stats').html('');

            data.forEach(function(bot){

                var $row = rowTemplate.clone();
                var $link = $('<a href="https://steamcommunity.com/profiles/'+bot.id64+'" target="_blank">'+bot.id64+'</a>');
                $row.find('.td-bot-username').html(bot.username);
                if(bot.trade_url)
                    $row.find('.td-bot-username').append(' <a href="'+bot.trade_url+'" target="_blank">(trade)</a>');

                $row.find('.td-bot-openid').html($link);
                $row.find('.td-bot-value').html(bot.value || "N/A");
                $row.find('.td-bot-items').html(bot.items || "N/A");
                $row.find('.td-bot-keys').html(bot.keys || "N/A");
                $row.find('.td-bot-lastactive').html(bot.secondsactive);

                var $locksCell = $row.find('.td-bot-locks');

                $locksCell.find('.lock').removeClass('uk-badge-danger');

                if(bot.locked && typeof bot.locked === 'object')
                {
                    $locksCell.find('.lock-global')
                        .attr('data-value', (bot.locked.global) ? 1 : 0)
                        .attr('data-id',bot.id64)
                        .attr('data-lock', 'global');

                    $locksCell.find('.lock-deposits')
                        .attr('data-value', (bot.locked.deposits) ? 1 : 0)
                        .attr('data-id',bot.id64)
                        .attr('data-lock', 'deposits');

                    $locksCell.find('.lock-withdraws')
                        .attr('data-value', (bot.locked.withdraws) ? 1 : 0)
                        .attr('data-id',bot.id64)
                        .attr('data-lock', 'withdraws');

                    if(bot.locked.global)
                        $locksCell.find('.lock-global').addClass('uk-badge-danger');


                    if(bot.locked.deposits)
                        $locksCell.find('.lock-deposits').addClass('uk-badge-danger');

                    if(bot.locked.withdraws)
                        $locksCell.find('.lock-withdraws').addClass('uk-badge-danger');
                }

                $locksCell.find('.bot-lock').unbind('click').click(function(){
                    var value = parseInt($(this).data('value'));
                    var id = $(this).data('id');
                    var lock = $(this).data('lock');

                    if(value >= 0 && id && lock)
                    {
                        handle_bot_lock(id, lock, value, function(response){
                            setTimeout(function(){
                                load_bots_list();
                            }, 500);
                        });
                    }
                });

                $('#bot-stats').append($row);
            });
        }

        function refresh_locks()  {
            $.ajax({
    			type: 'GET',
                dataType: 'json',
    			url: '/lock-status',
    			data: {
    				_csrf: csrfToken
    			}
    		}).done(function(response) {
                if(!response || !response.lock || typeof response.lock !== 'object')
                {
                    toastr.error("Unable to refresh locks status");
                    return;
                }
                locks_status = response.lock;
                refresh_locks_ui();
            });
        }

        function refresh_locks_ui() {
            var mmLocks = locks_status.middleman || {};
            var siteLocks = locks_status.site || {};

            var mm_buttons = {
                global_lock:    {e: $('#btn-lock-global'), unlock: '/unlock', lock: '/lock'},
                withdraw_lock:  {e: $('#btn-lock-withdraws'), unlock: '/unlock/withdraws', lock: '/lock/withdraws'},
                deposit_lock:   {e: $('#btn-lock-deposits'), unlock: '/unlock/deposits', lock: '/lock/deposits'},
            }

            var site_buttons = {
                bets:           {e: $('#btn-lock-bets'), unlock: '/bet-unlock', lock: '/bet-lock'},
                duels:          {e: $('#btn-lock-duels'), unlock: '/duel-unlock', lock: '/duel-lock'},
                sends:          {e: $('#btn-lock-sends'), unlock: '/send-unlock', lock: '/send-lock'},
                autolock:       {e: $('#btn-autolock'), unlock: '/enable-autolock', lock: '/disable-autolock'},
            }

            var mm_keys = Object.keys(mmLocks);
            var site_keys = Object.keys(siteLocks);

            mm_keys.forEach(function(i){
                handle_lock_button(mm_buttons[i], mmLocks[i]);
            });

            site_keys.forEach(function(i){
                var autolock = (i == "autolock");
                handle_lock_button(site_buttons[i], siteLocks[i], autolock);
            });

        }

        function handle_lock_button(btn, lock, is_autolock) {
            var elem = btn.e;
            var value = false;
            if(btn)
                elem.removeClass('uk-button-success').removeClass('uk-button-danger').html("Unknown");

            if(is_autolock) {
                if(lock) {
                    elem.addClass('uk-button-success').html("Enabled");
                    value = 0;
                } else {
                    elem.addClass('uk-button-danger').html("Disabled");
                    value = 1;
                }
            } else {
                if(lock) {
                    elem.addClass('uk-button-danger').html("Locked");
                    value = 1;
                }else{
                    elem.addClass('uk-button-success').html("Unlocked");
                    value = 0;
                }
            }

            elem.unbind('click').click(function(){
                var $self = $(this);
                var action = (value === 1) ? btn.unlock : btn.lock;
                $self.attr('disabled', 'disabled').html("...");
                do_lock_action('GET',action, function(){
                    $self.attr('disabled', false);
                    refresh_locks();
                });
            });
        }

        function do_lock_action(method,action,cb) {
            $.ajax({
    			type: method,
    			url: action,
    			data: {
    				_csrf: csrfToken
    			}
    		}).done(function(response) {
                setTimeout(function(){
                    cb();
                }, 500);
            });
        }

        function handle_bot_lock(id, lock, currentValue, cb) {
            var action = (currentValue === 0) ? "lock" : "unlock";

            var url = "/bot-lock/"+id+"/"+action+"/"+lock;

            $.ajax({
    			type: "GET",
    			url: url,
    			data: {
    				_csrf: csrfToken
    			}
    		}).done(function(response) {
                setTimeout(function(){
                    if(typeof cb === "function")
                        cb(response);
                }, 500);
            });
        }
        // END Service Page

    });

    onShowTabContent('.main', function(tab, ran){

        if(ran > 1)
            return false;

        var $spinner_transactions = $('.spinner-user-transactions');
        var $spinner_transfers = $('.spinner-user-transfers');
        var $accordion = UIkit.accordion($('#user-accordion'));

        $('#user-transfers').html("");

        function refresh_user_transactions(cb)
        {
            if(!moderationUser || !moderationUser.openId)
                return false;

            $spinner_transactions.addClass('uk-icon-spin');
            return $.ajax({
    			type: 'GET',
    			url: '/tables/user/'+moderationUser.openId+"/transactions",
    			data: {
    				_csrf: csrfToken
    			}
    		}).done(function(response) {
                if(response.transactions)
                {
                    $spinner_transactions.removeClass('uk-icon-spin');
                    generateTransactions(response.transactions);
                }
            });
        }

        function refresh_user_transfers(cb)
        {
            if(!moderationUser || !moderationUser.openId)
                return false;

            $spinner_transfers.addClass('uk-icon-spin');
            return $.ajax({
    			type: 'GET',
    			url: '/tables/user/'+moderationUser.openId+"/transfers",
    			data: {
    				_csrf: csrfToken
    			}
    		}).done(function(response) {
                if(response.transfers)
                {
                    $spinner_transfers.removeClass('uk-icon-spin');
                    generateUserTransfers(response.transfers);
                }
            });
        }

        function accordion_refresh(event,open){

            if(!moderationUser || !moderationUser.openId)
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

        accordion_refresh();
    });

    onShowTabContent('.stat-content', function(tab, ran){

        if(ran > 1)
            return false;

        var $spinner_balances = $('.spinner-top-balances');
        var $spinner_top_deposits = $('.spinner-top-deposits-withdraws');
        var $spinner_delta_deposits = $('.spinner-delta-deposits-withdraws');
        var $spinner_list_deposits = $('.spinner-deposits-withdraws');
        var $spinner_sends = $('.spinner-sends');

        var $accordion = UIkit.accordion($('#stats-accordion'));

        $('.uk-icon-refresh').removeClass('uk-icon-spin');

        // Stats
        $.ajax({
    		type: 'POST',
    		url: '/stats',
    		data: {
    			_csrf: csrfToken
    		}
    	}).done(function(response) {
    		generateStats(response.stats, response.skins, response.credits);
    	});

        // Tops

        var _user_html = function(user)
        {
            var $user = $("<span></span>");
            $user.append('<a class="uk-icon-external-link"></a> <small class="openId"></small><br /><small class="username"><a class="profile_link"></a></small>');
            $user.find('.profile_link').attr('href', 'https://steamcommunity.com/profiles/'+user.openId).attr('target','_blank').attr('title', escape(user.username));
            $user.find('.username .profile_link').html(escape(user.username));
            $user.find('.openId').html(user.openId);
            $user.find('.uk-icon-external-link').click(_lookup(user.openId));

            return $user;
        }

        var _row = function(target, data, value){
            if(!value)
                value = data.value;

            var $row = jqTemplates.top_row.clone();
            var $user = $row.find('.td-top-user');
            $user.html(_user_html(data));
            $row.find('.td-top-value').html(formatBet(value));
            $row.find('.td-top-locked').html(data.withdrawLock);

            $(target).append($row);
        };

        // Top - 500 Balances
        var $loading = jqTemplates.top_row_loading.clone();
        function refresh_500_balances(cb)
        {
            $spinner_balances.addClass('uk-icon-spin');
            $('#top-500-balance-content').html($loading.clone(false));
            return $.ajax({
    			type: 'GET',
    			url: '/top/500-balances',
    			data: {
    				_csrf: csrfToken
    			}
    		}).done(function(response) {
                $('#top-500-balance-content').html("");
                $spinner_balances.removeClass('uk-icon-spin');
                _.forEach(response.users, function(u){
                    _row('#top-500-balance-content', u, u.balance500);
                })
            });
        }
        // Top - Skinx Balances
        function refresh_skinx_balances(cb)
        {
            $spinner_balances.addClass('uk-icon-spin');
            $('#top-skinx-balance-content').html($loading.clone(false));
            return $.ajax({
    			type: 'GET',
    			url: '/top/skinx-balances',
    			data: {
    				_csrf: csrfToken
    			}
    		}).done(function(response) {
                $('#top-skinx-balance-content').html("");
                $spinner_balances.removeClass('uk-icon-spin');
                _.forEach(response.users, function(u){
                    _row('#top-skinx-balance-content', u, u.balanceSkinx);
                })

            });
        }

        // Top - 24H Deposits
        function refresh_top_deposits(cb)
        {
            $spinner_top_deposits.addClass('uk-icon-spin');
            $('#top-deposits-content').html($loading.clone(false));
            return $.ajax({
    			type: 'GET',
    			url: '/top/deposits',
    			data: {
    				_csrf: csrfToken
    			}
    		}).done(function(response) {
                $('#top-deposits-content').html("");
                $spinner_top_deposits.removeClass('uk-icon-spin');

                if(response.error || !response.deposits || !response.users)
                    return toastr.error("Failed to load Top 24H Deposits");

                _.forEach(response.deposits, function(d){
                    d.user = (response.users[d._id]) ? response.users[d._id] : {};
                    _row('#top-deposits-content', d.user, d.totalDeposits || d.user.depositValue || 0);
                })
            });
        }

        // Top - 24H Withdraws
        function refresh_top_withdraws(cb)
        {
            $spinner_top_deposits.addClass('uk-icon-spin');
            $('#top-withdraws-content').html($loading.clone(false));
            return $.ajax({
    			type: 'GET',
    			url: '/top/withdraws',
    			data: {
    				_csrf: csrfToken
    			}
    		}).done(function(response) {
                $('#top-withdraws-content').html("");
                $spinner_top_deposits.removeClass('uk-icon-spin');
                if(response.error || !response.withdraws || !response.users)
                    return toastr.error("Failed to load Top 24H Withdraws");

                _.forEach(response.withdraws, function(d){
                    d.user = (response.users[d._id]) ? response.users[d._id] : {};
                    _row('#top-withdraws-content', d.user, d.totalWithdraws || 0);
                })
            });
        }

        // Delta - 24H Deposits
        function refresh_delta_deposits(cb)
        {
            $spinner_delta_deposits.addClass('uk-icon-spin');
            $('#delta-deposits-content').html($loading.clone(false));
            $('#delta-withdraws-content').html($loading.clone(false));
            return $.ajax({
    			type: 'GET',
    			url: '/top/deposits_delta/100',
    			data: {
    				_csrf: csrfToken
    			}
    		}).done(function(response) {
                $('#delta-deposits-content').html("");
                $('#delta-withdraws-content').html("");
                $spinner_delta_deposits.removeClass('uk-icon-spin');

                if(response.error || !response.users)
                    return toastr.error("Failed to load Top 24H Deposits");

                if(response.depositsDelta)
                    _.forEach(response.depositsDelta, function(d){
                        d.user = (response.users[d._id]) ? response.users[d._id] : {};
                        _row('#delta-deposits-content', d.user, d.delta || 0);
                    })

                if(response.withdrawsDelta)
                    _.forEach(response.withdrawsDelta, function(d){
                        d.user = (response.users[d._id]) ? response.users[d._id] : {};
                        _row('#delta-withdraws-content', d.user, d.delta || 0);
                    })

            });
        }

        // Latest Deposits
        var _list_row = function(target, data){
            var $row = jqTemplates.list_deposit_row.clone();
            var $user = $row.find('.td-user');
            var $bot = $row.find('.td-bot');

            var shortBotId = "..."+data.botOpenId.substring(data.botOpenId.length - 6);
            var date = new Date(data.date);
            $user.html(_user_html(data.user));
            $bot.html('<small><a class="profile_link"></a></small>');
            $bot.find('.profile_link').attr('href', 'https://steamcommunity.com/profiles/'+data.botOpenId).attr('target','_blank').html(shortBotId);

            if(data.skins && data.skins.length)
            {
                var $skins = $('<ul class="list-skins">');
                _.forEach(data.skins, function(skin){
                    $skins.append('<li><strong>'+skin.name+'</strong> - '+formatBet(skin.value)+'</li>');
                });
                $row.find('.td-item').html($skins);
            }

            $row.find('.td-value').html(formatBet(data.value));
            $row.find('.td-state').html(data.state);
            $row.find('.td-date').html(date ? date.toISOString().replace("T"," ") : "N/A");

            $(target).append($row);
        };

        function refresh_list_deposits(cb)
        {
            $('#list-deposits-content').html($loading.clone(false));
            $spinner_list_deposits.addClass('uk-icon-spin');
            return $.ajax({
    			type: 'GET',
    			url: '/tables/transactions/deposits',
    			data: {
    				_csrf: csrfToken
    			}
    		}).done(function(response) {
                $('#list-deposits-content').html("");
                $spinner_list_deposits.removeClass('uk-icon-spin');

                if(response.error || !response.results)
                    return toastr.error("Failed to load Newest Deposits");

                _.forEach(response.results, function(r){
                    if(response.users && response.users[r.userId])
                        r.user = response.users[r.userId];
                    _list_row('#list-deposits-content', r);
                })
            });

        }

        function refresh_list_withdraws(cb)
        {
            $spinner_list_deposits.addClass('uk-icon-spin');
            $('#list-withdraws-content').html($loading.clone(false));
            return $.ajax({
    			type: 'GET',
    			url: '/tables/transactions/withdraws',
    			data: {
    				_csrf: csrfToken
    			}
    		}).done(function(response) {
                $('#list-withdraws-content').html("");
                $spinner_list_deposits.removeClass('uk-icon-spin');

                if(response.error || !response.results)
                    return toastr.error("Failed to load Newest Withdraws");

                _.forEach(response.results, function(r){
                    if(response.users && response.users[r.userId])
                        r.user = response.users[r.userId];
                    _list_row('#list-withdraws-content', r);
                })
            });
        }

        function refresh_list_sends(cb)
        {
            $spinner_sends.addClass('uk-icon-spin');
            $('#list-sends-content').html($loading.clone(false));
            return $.ajax({
    			type: 'GET',
    			url: '/tables/sends',
    			data: {
    				_csrf: csrfToken
    			}
    		}).done(function(response) {
                $('#list-sends-content').html("");
                $spinner_sends.removeClass('uk-icon-spin');

                if(response.error || !response.results)
                    return toastr.error("Failed to load Newest Sends");

                _.forEach(response.results, function(r){


                    if(!r.fromUser && response.users)
                    {
                        if(r.source && response.users[r.source])
                        {
                            r.fromUser = response.users[r.source];
                        }
                        else if(r.userId && response.userIds && response.userIds[r.userId])
                        {
                            var openId = response.userIds[r.userId];
                            if(response.users[openId])
                                r.fromUser = response.users[openId];
                        }
                    }

                    if(!r.toUser && response.users && response.users[r.destination])
                    {
                        r.toUser = response.users[r.destination];
                    }

                    var $row = jqTemplates.list_send_row.clone();

                    $row.find('.td-from').html(_user_html(r.fromUser));
                    $row.find('.td-to').html(_user_html(r.toUser));
                    $row.find('.td-value').html(formatBet(r.value));
                    $row.find('.td-date').html(r.date ? moment(r.date).format("YYYY-MM-DD hh:mm:ss") : "N/A");
                    $('#list-sends-content').append($row);
                })
            });
        }

        function refresh_top_sends(cb)
        {
            $spinner_sends.addClass('uk-icon-spin');
            $('#list-top-sends-content').html($loading.clone(false));
            return $.ajax({
    			type: 'GET',
    			url: '/tables/sends/top',
    			data: {
    				_csrf: csrfToken
    			}
    		}).done(function(response) {
                $('#list-top-sends-content').html("");
                $spinner_sends.removeClass('uk-icon-spin');

                if(response.error || !response.results)
                    return toastr.error("Failed to load Top Sends");

                _.forEach(response.results, function(r){

                    if(!r.fromUser && response.users)
                    {
                        if(r.source && response.users[r.source])
                        {
                            r.fromUser = response.users[r.source];
                        }
                        else if(r.userId && response.userIds && response.userIds[r.userId])
                        {
                            var openId = response.userIds[r.userId];
                            if(response.users[openId])
                                r.fromUser = response.users[openId];
                        }
                    }

                    if(!r.toUser && response.users && response.users[r.destination])
                    {
                        r.toUser = response.users[r.destination];
                    }

                    var $row = jqTemplates.list_send_row.clone();

                    $row.find('.td-from').html(_user_html(r.fromUser));
                    $row.find('.td-to').html(_user_html(r.toUser));
                    $row.find('.td-value').html(formatBet(r.value));
                    $row.find('.td-date').html(r.date ? moment(r.date).format("YYYY-MM-DD hh:mm:ss") : "N/A");
                    $('#list-top-sends-content').append($row);
                })
            });
        }

        $spinner_balances.on('click', function(e){
            e.preventDefault();
            refresh_500_balances().then(refresh_skinx_balances);
            return false;
        });
        $spinner_top_deposits.on('click', function(e){
            e.preventDefault();
            refresh_top_deposits().then(refresh_top_withdraws);
            return false;
        });

        $spinner_delta_deposits.on('click', function(e){
            e.preventDefault();
            refresh_delta_deposits();
            return false;
        });

        $spinner_list_deposits.on('click', function(e){
            e.preventDefault();
            refresh_list_deposits().then(refresh_list_withdraws);
            return false;
        });

        $spinner_sends.on('click', function(e){
            e.preventDefault();
            refresh_list_sends().then(refresh_top_sends);
            return false;
        });

        var init_stats_refresh = {}
        $accordion.on('toggle.uk.accordion', function(event,open){
            if(open)
            {
                var $open = $(this).find('.uk-accordion-content.uk-active');
                var refresh_key = $open.data('refresh');

                if(init_stats_refresh[refresh_key])
                    return false;

                init_stats_refresh[refresh_key] = true;

                if(refresh_key === 'refresh_balances') {
                    refresh_500_balances().then(refresh_skinx_balances)
                } else if(refresh_key === 'refresh_top_deposits') {
                    refresh_top_deposits().then(refresh_top_withdraws);
                } else if(refresh_key === 'refresh_list_deposits') {
                    refresh_list_deposits().then(refresh_list_withdraws);
                } else if(refresh_key === 'refresh_delta_deposits') {
                    refresh_delta_deposits();
                } else if(refresh_key === 'refresh_list_sends') {
                    refresh_list_sends().then(refresh_top_sends);
                }

            }
        });
    });

	$('#user-clear').on('click', function(){
		$('#id64-field').val("");
		$('#userid-field').val("");
		$("#ref-field").val("");
	});

    $('#estimated-balance').click(function(){
        if(!moderationUser.openId)
            return;

        var _inter = function(v){
            return ' <small class="intermediary">(subtotal: '+formatBet(v)+')</small>';
        };

        $.ajax({
			type: 'GET',
			url: '/user/estimated-balance?openId='+moderationUser.openId,
		}).done(function(response) {
            console.log(response);
            var $m = $('#estimated-container');
            $m.removeClass('uk-hidden');
            var sx_intermediary = 0;
            var c5_intermediary = 0;
            sx_intermediary += response.deposits;
            $m.find('.sx-deposits').html(formatBet(response.deposits) + _inter(sx_intermediary));
            sx_intermediary += response.transfers_skinx;
            $m.find('.sx-transfers').html(formatBet(response.transfers_skinx) + _inter(sx_intermediary));
            sx_intermediary += response.skinx_credits;
            $m.find('.sx-credits').html(formatBet(response.skinx_credits) + _inter(sx_intermediary));
            sx_intermediary += response.skinx_sends_recv;
            $m.find('.sx-transfers-recv').html(formatBet(response.skinx_sends_recv) + _inter(sx_intermediary));
            sx_intermediary -= response.skinx_sends_sent;
            $m.find('.sx-transfers-sent').html(formatBet(response.skinx_sends_sent) + _inter(sx_intermediary));
            sx_intermediary -= response.withdraws;
            $m.find('.sx-withdraws').html(formatBet(response.withdraws) + _inter(sx_intermediary));
            $m.find('.sx-refunds').html(formatBet(response.skinx_refunds) + _inter(sx_intermediary));

            c5_intermediary += response.transfers_csg500;
            $m.find('.c5-transfers').html(formatBet(response.transfers_csg500) + _inter(c5_intermediary));
            c5_intermediary += response.csg500_credits;
            $m.find('.c5-credits').html(formatBet(response.csg500_credits) + _inter(c5_intermediary));
            $m.find('.c5-refunds').html(formatBet(response.csg500_refunds) + _inter(c5_intermediary));
            c5_intermediary += response.deposit_credits;
            $m.find('.c5-credits-deposits').html(formatBet(response.deposit_credits) + _inter(c5_intermediary));

            c5_intermediary += response.reward;
            $m.find('.c5-reward').html(formatBet(response.reward) + _inter(c5_intermediary));
            $m.find('.c5-bets-played').html(formatBet(response.bets_played) + _inter(c5_intermediary));
            c5_intermediary += response.bets_balance;
            $m.find('.c5-bets-balance').html(formatBet(response.bets_balance) + _inter(c5_intermediary));
            $m.find('.c5-duels-played').html(formatBet(response.duels_played) + _inter(c5_intermediary));
            c5_intermediary += response.duels_balance;
            $m.find('.c5-duels-balance').html(formatBet(response.duels_balance) + _inter(c5_intermediary));

            $m.find('.c5-total').html(formatBet(response.csg500_total));
            $m.find('.sx-total').html(formatBet(response.skinx_total));
            $m.find('.grand-total').html(formatBet(response.total));

            $m.find('.intermediary').hide();
            $m.find('tr').hover(
                function(){ $(this).find('.intermediary').show();},
                function(){ $(this).find('.intermediary').hide();}
            );

        });

    });

	$('#user-search').on('click', function(){
		var searchId = $("#id64-field").val();
		var searchUserId = $("#userid-field").val();
		var searchRef = $("#ref-field").val();

		if(!searchUserId.trim() && !searchId.trim() && !searchRef.trim()){
			return;
		}

		$.ajax({
			type: 'POST',
			url: '/search',
			data: {
				userId: searchUserId,
				openId: searchId,
				referralCode: searchRef,
				_csrf: csrfToken
			}
		}).done(function(response) {

			if(!response.user){
				toastr.error("Failed to find User");

				$("#user-edit").hide();

				$("#userId").empty();
				$("#openId").empty();
				$("#username").empty();
				$("#balance").empty();
				$("#skinxbalance").empty();
				$("#played").empty();
				$("#deposit-value").empty();
				$("#level").empty();
				$("#collected").empty();
				$("#max-bet").empty();
				$("#ref-code").empty();
				$("#refs").empty();
				$("#tradeUrl").empty();
				$("#verified").empty();
				$("#muted").empty();
				$("#withdrawLock").empty();
				$("#tradeLock").empty();
                $("#registrationIp").empty();
                $("#registrationDate").empty();
                $("#lastLoginDate").empty();
                $("#loginIp").empty();

				$("#export-bets").prop("href","");
                $("#export-sends").prop("href","");

				$("#deposited").empty();
				$("#withdrawn").empty();
				$("#skinx-credited").empty();
				$("#credited").empty();
				$("#deposit-credited").empty();
                $("#skinx-refunded").empty();
				$("#refunded").empty();
				$("#deposit-refunded").empty();

				$("#transaction-profit").empty();

				$("#bets").text("");
				$("#winnings").text("");
				$("#bet-profit").text("");

				$("#duel-bets").text("");
				$("#duel-winnings").text("");
				$("#duel-profit").text("");

				$("#bet-history-table").empty();
				$("#duel-history-table").empty();

                $("#transactions").empty();
                $("#user-transfers").empty();
                $('#current-role strong').empty();
                $('#estimated-container').addClass('uk-hidden');
				return;
			}

			toastr.success("User Found");

            moderationUser = response.user;

            update_user_notes(response.user.notes || response.notes || []);
			generateUser(response.user);
			generateTransactionInfo(response.transactions, response.credits);
			generateTransactions(response.transactions);
            generateSendsInfo(response.user, response.sends);

			$("#bets").text("");
			$("#winnings").text("");
			$("#bet-profit").text("");

			$("#duel-bets").text("");
			$("#duel-winnings").text("");
			$("#duel-profit").text("");

			$("#bet-history-table").empty();
			$("#duel-history-table").empty();
            $('#estimated-container').addClass('uk-hidden');

            update_user_role(moderationUser.role);
		}).error(function(error){
			toastr.error("Failed to find User");

			$("#user-edit").hide();

			$("#userId").empty();
			$("#openId").empty();
			$("#username").empty();
			$("#balance").empty();
			$("#skinxbalance").empty();
			$("#played").empty();
			$("#deposit-value").empty();
			$("#level").empty();
			$("#collected").empty();
			$("#max-bet").empty();
			$("#ref-code").empty();
			$("#refs").empty();
			$("#tradeUrl").empty();
			$("#verified").empty();
			$("#muted").empty();
			$("#withdrawLock").empty();
			$("#tradeLock").empty();
            $("#registrationIp").empty();
            $("#registrationDate").empty();
            $("#lastLoginDate").empty();
            $("#loginIp").empty();

			$("#export-bets").prop('href', "");
			$("#export-sends").prop('href', "");

			$("#deposited").empty();
			$("#withdrawn").empty();
			$("#skinx-credited").empty();
			$("#credited").empty();
			$("#deposit-credited").empty();
			$("#transaction-profit").empty();

			$("#bets").text("");
			$("#winnings").text("");
			$("#bet-profit").text("");

			$("#duel-bets").text("");
			$("#duel-winnings").text("");
			$("#duel-profit").text("");

			$("#bet-history-table").empty();
			$("#duel-history-table").empty();
			$("#current-role strong").empty();
            $('#estimated-container').addClass('uk-hidden');
		});
	});

    function user_profile_link(user)
    {
        var openid = (typeof user === 'object' && user.openId) ? user.openId : user;
        return $('<a target="_blank"></a>').attr("href","https://steamcommunity.com/profiles/"+openid).text(openid);
    }

    function user_tradeurl_link(user)
    {
        var tradeurl = (typeof user === 'object' && user.tradeUrl) ? user.tradeUrl : user;
        return $('<a target="_blank"></a>').attr("href",tradeurl).html(escape(tradeurl));
    }

	function generateUser(user){

		if(user){
			$("#user-edit").show();
		}

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

        var $user_profile_link = user_profile_link(user.openId);
        var $user_tradeurl_link = user_tradeurl_link(user.tradeUrl)

		$("#userId").text(user._id);
		$("#openId").html($user_profile_link);
		$("#username").html(escape(user.username));
		$("#balance").text(formatBet(user.value));
		$("#skinxbalance").text(formatBet(user.skinxvalue));
		$("#played").text(formatBet(user.playedValue));
		$("#deposit-value").text(formatBet(user.depositValue));
		$("#level").text(Math.min(500, Math.floor(user.playedValue/50000)));
		$("#collected").text(formatBet(user.collectedReward));
		$("#max-bet").text(formatBet(user.maxBet));
		$("#ref-code").text(escape(user.referralCode));
		$("#refs").text(user.referrals);
		$("#tradeUrl").html($user_tradeurl_link);
		$("#verified").text(user.verified);
		$("#muted").text(muteText);
		$("#withdrawLock").text(user.withdrawLock);
		$("#tradeLock").text(user.tradeLock);

        $("#registrationIp").text(user.registrationIp || 'N/A');
        $("#loginIp").text(user.loginIp || 'N/A');
        $("#registrationDate").text(user.registrationDate ? moment(user.registrationDate).format('YYYY-MM-DD hh:mm:ss') : 'N/A');
        $("#lastLoginDate").text(user.lastLoginDate ? moment(user.lastLoginDate).format('YYYY-MM-DD hh:mm:ss') : 'N/A');

        $("#export-bets").prop("href","/export/bets/"+user.openId);
        $("#export-sends").prop("href","/export/sends/"+user.openId);
	}

    function generateSendsInfo(user, sends)
    {
        var sent = 0;
        var recv = 0;
        var totl = 0;

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

        $("#skinx-usersends-sent").text(formatBet(sent));
        $("#skinx-usersends-received").text(formatBet(recv));
        $("#skinx-usersends-total").text(formatBet(totl));
    }

	function generateTransactionInfo(transactions, credits){

		var deposited = 0;
		var withdrawn = 0;
		var skinxCredited = 0;
		var credited = 0;
		var depositCredited = 0;
        var skinxRefunded = 0;
        var refunded = 0;
        var depositRefunded = 0;

        console.log(credits);

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

            if(credit.isRefund || credit.isRefund === undefined)
            {
                skinxRefunded += credit.skinxvalue || 0;
    			refunded += credit.value || 0;
    			depositRefunded += credit.depositValue || 0;
            }
            else {

                skinxCredited += credit.skinxvalue || 0;
    			credited += credit.value || 0;
    			depositCredited += credit.depositValue || 0;

            }

		});

		$("#deposited").text(formatBet(deposited));
		$("#withdrawn").text(formatBet(withdrawn));
		$("#skinx-credited").text(formatBet(skinxCredited));
		$("#credited").text(formatBet(credited));
		$("#deposit-credited").text(formatBet(depositCredited));
        $("#skinx-refunded").text(formatBet(skinxRefunded));
		$("#refunded").text(formatBet(refunded));
		$("#deposit-refunded").text(formatBet(depositRefunded));
		$("#transaction-profit").text(formatBet(withdrawn - (deposited + depositCredited)));
	}

    $('#history-search').on('click', function(){
        var userid = $("#history-filter-userid").val().trim();
		var ccode = $("#history-filter-confirmation").val().trim();
        var $results = $('#history_table');

        if(!userid && !ccode){
			return;
		}

        var partial = jqTemplates.history_row_loading.clone(false);
        $results.html(partial);

		$.ajax({
			type: 'POST',
			url: '/history',
			data: {
				user_id: userid,
				confirmation_code: ccode,
				_csrf: csrfToken
			}
        }).done(function(response){

            if(response.error)
            {
                partial.find('.content').html(response.error);
                return;
            }

            $results.html("");

            $.each(response.results, function(idx, r){
                var row = jqTemplates.history_row.clone(false);
                row.find(".td-transaction-id").html(r.historyId);
                row.find(".td-user-id").html(user_profile_link(r.partner64Id));
                row.find(".td-action").html(r.action);
                row.find(".td-value").html(r.value);
                row.find(".td-tradeoffer-id").html(r.tradeOfferId);
                row.find(".td-confirmation-code").html(r.confirmationCode);
                row.find(".td-bot64id").html(user_profile_link(r.botOpenId));
                row.find(".td-state").html(r.state);
                row.find(".td-date").html(r.date_updated);

                $results.append(row);
            });

        }).error(function(err){
            partial.find('.content').html("Error Loading results...");
        });

    });
	$("#bet-refresh").on('click', function(){
		if(!moderationUser || !moderationUser.openId)
			return false;
		var userId = moderationUser.openId;
		if(userId) {
			$.ajax({
				type: 'POST',
				url: '/user-bets',
				data: {
					userId: userId,
					_csrf: csrfToken
				}
			}).done(function(response) {
				toastr.success("User Bets Found");
				generateBetInfo(response);
			}).error(function(error){
				if(error.status !== 500){
					toastr.error(error.responseText);
				} else {
					toastr.error("Failed to find Bets");
				}
			});
		}
	})

	function generateBetInfo(object){
		$("#bets").text(formatBet(object.bets));
		$("#winnings").text(formatBet(object.winnings));
		$("#bet-profit").text(formatBet(object.winnings - object.bets));

		$("#duel-bets").text(formatBet(object.duelBets));
		$("#duel-winnings").text(formatBet(object.duelWinnings));
		$("#duel-profit").text(formatBet(object.duelWinnings - object.duelBets));

		$("#bet-history-table").empty();
		$("#duel-history-table").empty();

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

			var betRow = "";
			betRow += '<tr>';
			betRow += '<td>' + value + '</td>';
			betRow += '<td>' + color + '</td>';
			betRow += '<td>' + moment(bet.date).format('MMMM Do YYYY, h:mm:ss a') + '</td>';
			betRow += '</tr>';
			$("#bet-history-table").append(betRow);
		}

		var duels = object.lastDuels;
		var userId = $("#userId").text();
		for(var i = 0; i < duels.length; i ++) {
			var duel = duels[i];
			var duelRow = "";
			var winAmount = duel.worth;
			if((duel.createId === userId && duel.createChoice !== duel.choice) || (duel.joinId === userId && duel.createChoice === duel.choice)){
				winAmount *= -1;
			} else {
				winAmount = Math.floor(duel.worth*2*0.97) - duel.worth;
			}
			duelRow += '<tr>';
			duelRow += '<td>' + formatBet(winAmount) + '</td>';
			duelRow += '<td>' + (duel.choice?"Blue":"Red") + '</td>';
			duelRow += '<td>' + moment(duel.startDate).format('MMMM Do YYYY, h:mm:ss a') + '</td>';
			duelRow += '</tr>';
			$("#duel-history-table").append(duelRow);
		}
	}

	function generateTransactions(transactions){
		$("#transactions").empty();
		for (var i = 0; i < transactions.length; i ++) {
			var transaction = transactions[i];
			var transactionHtml = "";
			transactionHtml += '<tr>';
			transactionHtml += '<td class="transactionid">' + transaction.transactionId + '</td>';
			transactionHtml += '<td class="action">' + transaction.action + '</td>';
			transactionHtml += '<td class="value">' + transaction.value + '</td>';
			transactionHtml += '<td class="tradeofferid">' + transaction.tradeOfferId + '</td>';
			transactionHtml += '<td class="skins">';
			for (var x = 0; x < transaction.skins.length; x++) {
				transactionHtml += escape(transaction.skins[x].name) + "</br>";
			}
			transactionHtml +=	'</td>';
			transactionHtml += '<td class="confirmationcode">' + transaction.confirmationCode + '</td>';
			transactionHtml += '<td class="botid">' + transaction.botOpenId + '</td>';
			transactionHtml += '<td class="state">' + transaction.state + '</td>';

			var date = new Date(transaction.date);

			transactionHtml += '<td class="date">' + moment(date).format('MMMM Do YYYY, h:mm:ss a'); + '</td>';
			transactionHtml += '</tr>';
			$("#transactions").append(transactionHtml);
		}
	}

    function generateUserTransfers(transfers)
    {

        if(!moderationUser || !moderationUser.openId)
            return false;

        $("#user-transfers").empty();
        _.forEach(transfers, function(transfer){
            var html = $("<tr>");
            var type = (transfer.destination === moderationUser.openId) ? "received" : "sent";
            var mod = (type === "received") ? 1 : -1;
            var date = new Date(transfer.date);

            var $from = null;
            var $to = null;
            var $lookup = $('<a class="uk-icon-external-link"></a>');
            var $link = $('<a target="_blank"></a>')

            if(type === "received")
            {
                $link.prop('href', 'https://steamcommunity.com/profiles/'+transfer.source).html(transfer.source);
                $lookup.click(_lookup(transfer.source));
                $from = $('<span>');
                $from.append($lookup).append(" ").append($link);
                $to = "N/A";
            }
            else
            {
                $link.prop('href', 'https://steamcommunity.com/profiles/'+transfer.destination).html(transfer.destination);
                $lookup.click(_lookup(transfer.destination));
                $to = $('<span>');
                $to.append($lookup).append($link);
                $from = "N/A";
            }

            html.append($("<td></td>").html(type === "received" ? "Received" : "Sent"));
            html.append($("<td></td>").html($from));
            html.append($("<td></td>").html($to));
            html.append($("<td></td>").html( formatBet(transfer.value * mod)));
            html.append($("<td class='date'></td>").html(moment(date).format('MMMM Do YYYY, h:mm:ss a')));

            $("#user-transfers").append(html);
        });
    }

	function generateStats(stats, skins, credits){
		$("#credit-history").empty();
		for (var i = 0; i < credits.length; i ++) {
			var credit = credits[i];
			var creditHtml = "";

            var $open_id_link = $('<td></td>').html(user_profile_link(credit.openId));
            var $creditor_id_link = $('<td></td>').html(user_profile_link(credit.creditor));

			creditHtml += '<tr>';
			creditHtml += $open_id_link[0].outerHTML;
			creditHtml += $creditor_id_link[0].outerHTML;
			creditHtml += '<td>' + credit.skinxvalue + '</td>';
			creditHtml += '<td>' + credit.value + '</td>';
			creditHtml += '<td>' + credit.depositValue + '</td>';
			var date = new Date(credit.date);
			creditHtml += '<td class="date">' + moment(date).format('MMMM Do YYYY, h:mm:ss a'); + '</td>';
			creditHtml += '</tr>';
			$("#credit-history").append(creditHtml);
		}
		$("#skin-history").empty();
		for (var i = 0; i < skins.length; i ++) {
			var skin = skins[i];
			var skinHtml = "";
            var $skin_open_id_link = $('<td></td>').html(user_profile_link(skin.openId));
			skinHtml += '<tr>';
			skinHtml += '<td>' + skin.name + '</td>';
			skinHtml += '<td>' + skin.value + '</td>';
			skinHtml += $skin_open_id_link[0].outerHTML;;
			var date = new Date(skin.date);
			skinHtml += '<td class="date">' + moment(date).format('MMMM Do YYYY, h:mm:ss a'); + '</td>';
			skinHtml += '</tr>';
			$("#skin-history").append(skinHtml);
		}


		$('#total-users').text(formatBet(stats.totalUsers));
		$('#total-economy').text(formatBet(stats.totalEconomy));
		$('#total-withdrawable').text(formatBet(stats.totalWithdrawable));
		$('#total-skinx-economy').text(formatBet(stats.totalSkinxEconomy));
		$('#total-skinx-withdrawable').text(formatBet(stats.totalSkinxWithdrawable));
		$('#total-deposits').text(formatBet(stats.totalDeposit));
		$('#total-withdraws').text(formatBet(stats.totalWithdraw));
		$('#total-referrals').text(formatBet(stats.totalReferral));
		$('#total-shop-count').text(formatBet(stats.totalShopCount));
		$('#total-shop').text(formatBet(stats.totalShop));
		$('#total-rounds').text(formatBet(stats.totalRounds));
		$('#total-blacks').text(formatBet(stats.totalBlack) + " (" + Math.floor((1 - 2*stats.totalBlack/stats.totalRounds)*100000)/1000 + "%)");
		$('#total-reds').text(formatBet(stats.totalRed) + " (" + Math.floor((1 - 3*stats.totalRed/stats.totalRounds)*100000)/1000 + "%)");
		$('#total-blues').text(formatBet(stats.totalBlue) + " (" + Math.floor((1 - 5*stats.totalBlue/stats.totalRounds)*100000)/1000 + "%)");
		$('#total-yellows').text(formatBet(stats.totalYellow) + " (" + Math.floor((1 - 50*stats.totalYellow/stats.totalRounds)*100000)/1000 + "%)");
		$('#total-bet').text(formatBet(stats.totalBet));
		$('#total-duels').text(formatBet(stats.totalDuels));
		$('#total-duels-red').text(formatBet(stats.totalDuelsRed));
		$('#total-duels-blue').text(formatBet(stats.totalDuelsBlue));
		$('#total-credits').text(formatBet(stats.totalCredits));
		$('#total-uncredits').text(formatBet(stats.totalUncredits));

		$('#moving-deposits').text(formatBet(stats.movingDeposit));
		$('#moving-withdraws').text(formatBet(stats.movingWithdraw));
		$('#moving-referrals').text(formatBet(stats.movingReferral));
		$('#moving-rewards').text(formatBet(Math.floor(stats.movingRewards/10000)));
		$('#moving-rewards-user').text(formatBet(stats.movingRewardsUser));
		$('#moving-rounds').text(formatBet(stats.movingRounds));
		$('#moving-blacks').text(formatBet(stats.movingBlack) + " (" + Math.floor((1 - 2*stats.movingBlack/stats.movingRounds)*100000)/1000 + "%)");
		$('#moving-reds').text(formatBet(stats.movingRed) + " (" + Math.floor((1 - 3*stats.movingRed/stats.movingRounds)*100000)/1000 + "%)");
		$('#moving-blues').text(formatBet(stats.movingBlue) + " (" + Math.floor((1 - 5*stats.movingBlue/stats.movingRounds)*100000)/1000 + "%)");
		$('#moving-yellows').text(formatBet(stats.movingYellow) + " (" + Math.floor((1 - 50*stats.movingYellow/stats.movingRounds)*100000)/1000 + "%)");
		$('#moving-in').text(formatBet(stats.movingIn));
		$('#moving-out').text(formatBet(stats.movingOut));
		$('#moving-bet').text(formatBet(stats.movingBet));
		$('#moving-duels').text(formatBet(stats.movingDuels));
		$('#moving-duels-red').text(formatBet(stats.movingDuelsRed + " (" + Math.floor((1 - 2*stats.movingDuelsRed/stats.movingDuels)*100000)/1000 + "%)"));
		$('#moving-duels-blue').text(formatBet(stats.movingDuelsBlue + " (" + Math.floor((1 - 2*stats.movingDuelsBlue/stats.movingDuels)*100000)/1000 + "%)"));
		$('#moving-duels-in').text(formatBet(stats.movingDuelsIn * 2));
		$('#moving-duels-out').text(formatBet(stats.movingDuelsIn * 2 * 0.97));
		$('#moving-credits').text(formatBet(stats.movingCredits));
		$('#moving-uncredits').text(formatBet(stats.movingUncredits));

		$('#stats-date').text(moment(stats.date).format('h:mm a'));
	}

    var _lookup = function(openId)
    {
        return function(){
            $('#id64-field').val(openId);
            $('#user-search').click();
            toastr.success("Searching for user "+openId);
            showContent('.main');
        };
    }

    showContent('.main');

	// function generateBots(bots) {
	// 	$("#bot-stats").empty();
	// 	for (var openId in bots) {
	// 		var items = bots[openId];
    //
	// 		var value = 0;
	// 		for(var i = 0; i < items.length; i++){
	// 			value += items[i].value;
	// 		}
    //
	// 		var botHtml = "";
	// 		botHtml += '<tr>';
	// 		botHtml += '<td>' + openId + '</td>';
	// 		botHtml += '<td>' + value + '</td>';
	// 		botHtml += '<td>' + items.length + ' (' + Math.floor(items.length/950*1000)/10 + '%)</td>';
	// 		botHtml += '</tr>';
	// 		$("#bot-stats").append(botHtml);
	// 	}
	// }

	// $.ajax({
	// 	type: 'POST',
	// 	url: '/stats-bots',
	// 	data: {
	// 		_csrf: csrfToken
	// 	}
	// }).done(function(response) {
	// 	generateBots(response);
	// });

});
