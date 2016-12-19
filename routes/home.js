
;(function() {
    'use strict';

    var Promise = require('bluebird');

    var roles = require('../utils/RolesHelper');
    var roleRequired = require('./middleware/roleRequired');
    var requirePostData = require('./middleware/postRequired');

    var requireModeratorLevel = roleRequired(roles.mod);
    var requireAdminLevel = roleRequired(roles.admin);
    var _ = require('lodash');

    module.exports = function(app, router)
    {
        var logger = app.logger;
        var models = app.models;

        app.get('/', requireModeratorLevel, function(req, res) {

            return res.render('index', {stats: {}});

        });

        app.post('/search', requireModeratorLevel, requirePostData(), function(req, res) {

    		var body = req.body;

    		var query = {};
    		var userId = body.userId;
    		if(typeof userId === 'string' && userId){
    			query._id = userId;
    		}

    		var referralCode = body.referralCode;
    		if(typeof referralCode === 'string' && referralCode){
    			query.referralCode = referralCode;
    		}

    		var openId = body.openId;
    		if(typeof openId === 'string' && openId){
                query.openId = new RegExp(openId+"$");
    		}

            console.log(query);

            var collected = {};

    		models.User.findOne(query).exec().then(function(user) {

                if(!user || !user.id){
                    return Promise.reject("user not found");
                }

                collected.user = user;

                return models.Note.findUserNotes(user.openId);
            }).then(function(notes){

                collected.notes = notes;
                return models.Transaction.find({openId: collected.user.openId}).sort({date: -1}).exec();

            }).then(function(transactions){

                collected.transactions = transactions;
                return models.Credit.find({openId: collected.user.openId}).exec();

            }).then(function(credits){

                collected.credits = credits;
                return collected.user.findSends();

            }).then(function(sends){

                res.json({
                    user: collected.user,
                    notes: collected.notes,
                    credits: collected.credits,
                    transactions: collected.transactions,
                    sends: sends
                });

                collected = null;
                return;

            }).catch(function(err){
                logger.info(err);
                return res.status(404).send();
            });
    	});

        app.post('/user-bets', requireModeratorLevel, requirePostData('userId'), function(req, res) {

    		var body = req.body;
    		var userId = body.userId;

            var queries = [];

            models.Reservation.find({openId: userId}).sort({date: -1}).exec().then(function(reservationList){
                // bets
                var bets = 0;
    			var winnings = 0;
    			var last = [];
    			for(var i = 0; i < reservationList.length; i++){
    				var reservation = reservationList[i];
    				if(reservation.type === "in"){
    					bets += reservation.value;
    				} else {
    					winnings += reservation.value;
    				}

    				if(last.length < 1000){
    					last.push(reservation);
    				}
    			}

                return res.json({
                    bets: bets,
                    winnings: winnings,
                    duelBets: 0,
                    duelWinnings: 0,
                    last: last,
                    lastDuels: []
                });
            }).catch(function(err){
                return res.status(404).send();
            });
    	});


        app.post('/withdrawLock', requireModeratorLevel, requirePostData('openId'), function(req, res){

    		var openId = req.body.openId;

    		models.User.withdrawLock(openId, function(err, response){
    			if(err){
    				logger.info("ERROR: [" + openId + "]");
    				logger.info(err);
    				return res.status(500).send();
    			}

    			if(response.nModified === 0){
    				return res.status(400).send("Failed to withdraw lock user");
    			}

    			return res.status(200).send();
    		});
    	});

    	app.post('/withdrawUnlock', requireModeratorLevel, requirePostData('openId'), function(req, res){

    		var openId = req.body.openId;

    		models.User.withdrawUnlock(openId, function(err, response){
    			if(err){
    				logger.info("ERROR: [" + openId + "]");
    				logger.info(err);
    				return res.status(500).send();
    			}

    			if(response.nModified === 0){
    				return res.status(400).send("Failed to withdraw unlock user");
    			}

    			return res.status(200).send();
    		});
    	});

    	app.post('/trade-unlock', requireModeratorLevel, requirePostData('openId'), function(req, res){
    		var user = req.user;
            var body = req.body;
    		var openId = body.openId;

            models.User.archiveTradeLocks(openId).then(function(response){

    			return res.status(200).send();

	       }).catch(function(err){
                logger.info("ERROR: [" + openId + "]");
                logger.info(err);
                return res.status(400).send();
            });
        });

        app.get('/user/estimated-balance', requireModeratorLevel, function(req,res){

            var openId = req.query.openId;
            if(!openId)
            {
                return res.status(404).send("invalid user id");
            }

            models.User.findOne({openId: openId}, function(err, targetUser){

                if(err || !targetUser)
                    return res.status(404).send("user not found");

                var estimated = {
                    total: 0,
                    csg500_total: targetUser.collectedReward || 0,
                    skinx_total: 0,
                    transactions: 0,
                    deposits: 0,
                    withdraws: 0,
                    csg500_credits: 0,
                    skinx_credits: 0,
                    total_credits: 0,
                    csg500_refunds: 0,
                    skinx_refunds: 0,
                    total_refunds: 0,
                    skinx_sends_sent: 0,
                    skinx_sends_recv: 0,
                    total_sends: 0,
                    deposit_credits: 0,
                    transfers_skinx: 0,
                    transfers_skinx_sent: 0,
                    transfers_skinx_recv: 0,
                    transfers_csg500: 0,
                    transfers_csg500_sent: 0,
                    transfers_csg500_recv: 0,
                    reward: targetUser.collectedReward || 0,
                    bets_played: 0,
                    bets_balance: 0,
                    duels_played: 0,
                    duels_balance: 0,
                    csg500_value: targetUser.value,
                    skinx_value: targetUser.skinxvalue,
                }

                var data = {};
                models.Transaction.find({userId: targetUser.id}).then(function(transactions){
                    data.transactions = transactions;
                    return models.Credit.find({openId: openId});

                }).then(function(credits){
                    data.credits = credits;
                    return models.Reservation.find({userId: targetUser.id});

                }).then(function(reservations){
                    data.reservations = reservations;
                    return targetUser.findSends();

                }).then(function(sends){
                    data.sends = sends;

                    return data;

                }).then(function(data){

                    _.forEach(data.transactions, function(transaction){
                        if(transaction.state !== "Accepted")
                            return;

                        estimated.transactions += transaction.value || 0;

                        if(transaction.action === "Withdraw")
                        {
                            estimated.skinx_total -= transaction.value || 0;
                            estimated.withdraws += transaction.value || 0;
                        }
                        else if(transaction.action === "Deposit")
                        {
                            estimated.skinx_total += transaction.value || 0;
                            estimated.deposits += transaction.value || 0;
                        }

                    });

                    _.forEach(data.sends, function(send){

                        var type = send.getTypeByUser(targetUser);

                        if(type === "sent")
                        {
                            estimated.skinx_sends_sent += send.value;
                            estimated.total_sends -= send.value;
                            estimated.skinx_total -= send.value;
                        }
                        else if(type === "received")
                        {
                            estimated.skinx_sends_recv += send.value;
                            estimated.total_sends += send.value;
                            estimated.skinx_total += send.value;
                        }

                    });

                    _.forEach(data.credits, function(credit){

                        if(credit.isRefund === true || credit.isRefund === undefined)
                        {
                            estimated.csg500_refunds += credit.value || 0;
                            estimated.deposit_refunds += credit.depositValue || 0;
                            estimated.skinx_refunds += credit.skinxvalue || 0;
                            estimated.total_refunds += credit.value + credit.depositValue + credit.skinxvalue;
                        }
                        else {
                            estimated.skinx_total += credit.skinxvalue || 0;
                            estimated.csg500_total += credit.depositValue || 0;
                            estimated.csg500_total += credit.value || 0;

                            estimated.csg500_credits += credit.value || 0;
                            estimated.deposit_credits += credit.depositValue || 0;
                            estimated.skinx_credits += credit.skinxvalue || 0;
                            estimated.total_credits += credit.value + credit.depositValue + credit.skinxvalue;
                        }
                    });

                    _.forEach(data.reservations, function(reservation){

                        if(reservation.type == "in")
                        {
                            estimated.bets_played += reservation.worth || 0;
                            estimated.bets_balance -= reservation.worth || 0;
                            estimated.csg500_total -= reservation.worth || 0;
                        }
                        else
                        {
                            estimated.bets_balance += reservation.worth || 0;
                            estimated.csg500_total += reservation.worth || 0;
                        }
                    });

                    // var duel_bets = 0;
                    // var duel_wins = 0;
                    // _.forEach(data.duels, function(duel){
                    //     duel_bets += duel.worth || 0;
                    //     if(duel.createId === targetUser.id && duel.createChoice === duel.choice){
                    //         duel_wins += Math.floor((duel.worth || 0)*2*0.97);
                    //     } else if(duel.joinId === targetUser.id && duel.createChoice !== duel.choice){
                    //         duel_wins += Math.floor((duel.worth || 0)*2*0.97);
                    //     }
                    // });
                    //
                    // estimated.duels_played = duel_bets || 0;
                    // estimated.duels_balance += (duel_wins || 0) - (duel_bets || 0);
                    // estimated.csg500_total += (duel_wins || 0) - (duel_bets || 0);

                    estimated.total = (estimated.csg500_total || 0)  + (estimated.skinx_total || 0);
                    return res.json(estimated);
                });
            });


        });

    }
}());
