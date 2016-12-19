;(function() {
    'use strict';

    var _ = require('lodash');
    var Promise = require('bluebird');
    var roles = require('../utils/RolesHelper');
    var roleRequired = require('./middleware/roleRequired');
    var requirePostData = require('./middleware/postRequired');
    var request = require('request');

    var requireModeratorLevel = roleRequired(roles.mod);
    var requireAdminLevel = roleRequired(roles.admin);


    module.exports = function(app, router) {
        var logger = app.logger;
        var models = app.models;
        var redis = app.redis.client();

        var mmConfig = app.config.get('middleman');

        app.get('/bots', requireAdminLevel, function(req, res){

            var fill_bots_data = function(botsList)
            {
                var collected = {};
                return models.Shop.find().exec().then(function(shopSkins){
                    collected.shopSkins = shopSkins;
                    var skinNames = [];
        			for(var i = 0; i < shopSkins.length; i++){
                        var name = shopSkins[i].name;
        				if(skinNames.indexOf(name) < 0)
                            skinNames.push(name);
        			}

                    if(!skinNames.length)
                    {
                        return Promise.resolve([]);
                    }

                    return models.Skin.find({'name': { $in: skinNames}}).exec();

                }).then(function(skins){

                    var values = {};
                    var botStuff = {};

                    _.forEach(skins, function(skin){
                        values[skin.name] = skin.value;
                    });

                    _.forEach(collected.shopSkins, function(skin, key){
                        skin.value = values[skin.name] || 0;

                        var id = skin.openId.toString();

                        if(!botStuff[id])
                        {
                            botStuff[id] = {
                                value: 0,
                                items: 0,
                                keys: 0
                            }
                        }

                        botStuff[id].items += 1;
                        botStuff[id].value += skin.value;

                        if(_.includes(skin.name.toLowerCase(),'case key') || _.includes(skin.name.toLowerCase(),'esports key'))
                        {
                            botStuff[id].keys += 1;
                        }
                    });

                    collected.shopSkins = null;
                    var now = new Date().getTime();

                    botsList = _.map(botsList, function(bot){

                        if(botStuff[bot.id64])
                        {
                            bot.items = botStuff[bot.id64].items;
                            bot.value = botStuff[bot.id64].value;
                            bot.keys = botStuff[bot.id64].keys;
                        }
                        var active = new Date(bot.lastactive);
                        var time = "seconds";
                        var realDiff = now - active.getTime();
                        var diff = Math.round(realDiff / 1000);

                        if(diff > 86400)
                        {
                            diff = Math.round(realDiff / (1000 * 86400) * 10) / 10;
                            time = "days";
                        }
                        else if(diff > 3600)
                        {
                            diff = Math.round(realDiff / (1000 * 3600) * 10) / 10;
                            time = "hours";
                        }
                        else if(diff > 60)
                        {
                            diff = Math.round(realDiff / (1000 * 60));
                            time = "minutes";
                        }

                        bot.secondsactive = diff + " "+time+" ago";
                        return bot;
                    });

                    return Promise.resolve(botsList);
                });
            };


            request.post({
    			url: mmConfig.url+'/bots',
    			json: true
    		}, function (error, response, body) {

                if(!error && typeof body === "object")
                {
                    body = _.sortBy(body, 'username');
                    fill_bots_data(body).then((bots)=>{
                        return res.json({error: null, bots: body});
                    }).catch((err)=>{
                        logger.error(err);
                        return res.json({error: err});
                    })

                }
                else if(error)
                {
                    return res.status(404).json({error: error})
                }
                else {
                    return res.status(404).json({error: "Unknown response", response: body})
                }
    		});
    	});

        app.get('/bots/refresh', function(req, res){
    		var user = req.user;
    		if(!user){
    			return res.status(404).send();
    		}

    		var role = user.role;
    		if(role !== SecretConfig.ROLES.ADMIN) {
    			return res.status(404).send();
    		}

            request.post({
    			url: SecretConfig.BOT_URL+'/bots/refresh_inventories',
    			json: true
    		}, function (error, response, body) {
                var ret = {
                    error: error,
                    sent: false
                };

                if(typeof body === 'object')
                {
                    ret = _.merge(ret,body);
                }

                return res.json(ret);
            });
        });
    };
}());
