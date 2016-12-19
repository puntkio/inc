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

        app.get('/tables/user/:openId/:type(transactions|transfers)/:page?',requireModeratorLevel,  function(req, res){

            var type = req.params.type;
            var user = req.user;
            var targetOpenId = req.params.openId;

            var collected = {
                user: {},
                sends: [],
                transactions: []
            };

            var Q = models.User.findOne({openId: targetOpenId})
            .then(function(targetUser){
                collected.user = targetUser;

                if(type === "transactions")
                {
                    return models.Transaction.find({openId: targetOpenId}).sort({date: -1})
                    .then(function(transactions){
                        collected.transactions = transactions;
                        return true;
                    }).catch(function(err){
                        logger.error(err);
                        return res.status(404).send();
                    });
                }
                else if(type === "transfers")
                {
                    return targetUser.findSends().sort({date: -1}).exec()
                    .then(function(sends){
                        collected.sends = sends;
                        return true;
                    }).catch(function(err){
                        logger.error(err);
                        return res.status(404).send();
                    })
                }
            }).catch(function(err){
                logger.error(err);
                return res.status(404).send();
            });

            Q.then(function(result){

                return res.json({
                    error: false,
                    transfers: collected.sends,
                    transactions: collected.transactions
                });

            }).catch(function(){
                return res.status(404).json({error: "invalid result"});
            });

        });

        app.get('/tables/transactions/:type(deposits|withdraws)/:page?', function(req,res){

            var user = req.user;

    		if(!user){
    			return res.status(404).send();
    		}

    		var role = user.role;
    		if(role !== SecretConfig.ROLES.ADMIN) {
    			return res.status(404).send();
    		}
            var type = req.params.type;
            var page = parseInt(req.params.page) || 1;
            var limit = 500;
            var offset = (page-1)*limit;

            if(offset < 0)
                offset = 0;

            var tableQuery = false;
            var countQuery = false;
            var collected = {};
            var queryArgs = {};
            var maxCount = 500;
            queryArgs.action = (type == "deposits") ? "Deposit" : "Withdraw";
            tableQuery = Transaction.find(queryArgs);
            tableQuery.sort("-date");
            tableQuery.limit(limit);
            tableQuery.skip(offset);

            tableQuery.then(function(results){
                collected.results = results;

                var userIds = _.map(results, function(r){
                    return r.userId;
                });

                userIds = _.uniq(userIds);

                return User.find({_id: {$in: userIds}});

            }).then(function(users){

                var parsedUsers = {};
                _.forEach(users, function(u){
                    parsedUsers[u.id] = {
                        openId: u.openId,
                        username: u.username,
                        avatar: u.avatar,
                        role: u.role,
                        value: u.value,
                        playedValue: u.playedValue,
                        skinxValue: u.skinxValue,
                        verified: true
                    };
                });

                collected.users = parsedUsers;
                return Transaction.count(queryArgs);

            }).then(function(count){

                if(count > maxCount)
                    count = maxCount;

                collected.count = count;

                collected.nextPage = (count > offset+limit) ? page+1 : false;
                collected.prevPage = (page > 1) ? page-1 : false;
                collected.maxPages = Math.ceil(count / limit);

                return res.json(collected);
            });
        });

        app.get('/tables/sends/:type(top)?/:page?', function(req,res){
            var user = req.user;

    		if(!user){
    			return res.status(404).send();
    		}

    		var role = user.role;
    		if(role !== SecretConfig.ROLES.ADMIN) {
    			return res.status(404).send();
    		}
            var page = parseInt(req.params.page) || 1;
            var type = req.params.type;
            var limit = 500;
            var offset = (page-1)*limit;

            if(offset < 0)
                offset = 0;

            var tableQuery = false;
            var countQuery = false;
            var collected = {};
            var queryArgs = {};
            var maxCount = 500;

            tableQuery = UserSend.find(queryArgs);

            if(type == "top")
                tableQuery.sort("-value");
            else
                tableQuery.sort("-date");

            tableQuery.limit(limit);
            tableQuery.skip(offset);

            tableQuery.then(function(results){
                collected.results = results;

                var userIds = [];
                var openIds = [];

                _.forEach(results, function(r){
                    userIds.push(r.userId);
                    openIds.push(r.destination);
                });

                userIds = _.uniq(userIds);

                return User.find({$or: [
                    {_id: {$in: userIds}},
                    {openId: {$in: openIds}}
                ]});

            }).then(function(users){

                var parsedUsers = {};
                var userIdToOpenid = {};
                _.forEach(users, function(u){

                    if(parsedUsers[u.openId])
                        return;

                    parsedUsers[u.openId] = {
                        openId: u.openId,
                        username: u.username,
                        avatar: u.avatar,
                        role: u.role,
                        value: u.value,
                        playedValue: u.playedValue,
                        skinxValue: u.skinxValue,
                        verified: true
                    };

                    userIdToOpenid[u.id] = u.openId;
                });

                collected.users = parsedUsers;
                collected.userIds = userIdToOpenid;
                return UserSend.count(queryArgs);

            }).then(function(count){

                if(count > maxCount)
                    count = maxCount;

                collected.count = count;

                collected.nextPage = (count > offset+limit) ? page+1 : false;
                collected.prevPage = (page > 1) ? page-1 : false;
                collected.maxPages = Math.ceil(count / limit);

                return res.json(collected);
            });
        });
    };

}());
