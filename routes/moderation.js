;(function() {
    'use strict';

    var _ = require('lodash');
    var Promise = require('bluebird');
    var roles = require('../utils/RolesHelper');
    var roleRequired = require('./middleware/roleRequired');
    var requirePostData = require('./middleware/postRequired');

    var requireModeratorLevel = roleRequired(roles.mod);
    var requireAdminLevel = roleRequired(roles.admin);

    module.exports = function(app, router)
    {
        var logger = app.logger;
        var models = app.models;
        var redis = app.redis.client();

        app.post('/moderate/user-lock', requireModeratorLevel, requirePostData(), function(req, res){

            var body = req.body;

            if(body.action !== "unlock")
                body.action = "lock";

            if(!body.target || _.indexOf(["withdraws","deposits","bets","duels","sends"], body.target) < 0)
                return res.status(404).send("invalid 'target' specifided. must be 'withdraws','deposits','bets','duels'");

            if(!body.userOpenId)
                return res.status(404).send("'userOpenId' not specified");

            var queries = [];

            var field = false;
            var value = 0;
            switch(body.target)
            {
                case 'withdraws':   field = 'withdrawLock'; value = (body.action === "unlock") ? false : true; break;
                case 'deposits':    field = 'depositLock'; value = (body.action === "unlock") ? 0 : 1; break;
                case 'bets':        field = 'lockedBets' ; value = (body.action === "unlock") ? 0 : 1; break;
                case 'duels':       field = 'lockedDuels' ; value = (body.action === "unlock") ? 0 : 1; break;
                case 'sends':       field = 'sendLock' ; value = (body.action === "unlock") ? false : true; break;
            }

            var updateData = {};
            updateData[field] = value;

            models.User.findOneAndUpdate({openId: body.userOpenId}, { $set: updateData }, {new: true}).exec().then(function(saved){

                if(!saved || !saved.id)
                {
                    return res.status(404).send("Failed to update lock: "+body.target+", action: "+body.action);
                }

                var pubData = JSON.stringify({
                    userOpenId: saved.openId,
                    userId: saved.id,
                    withdraws: saved.withdrawLock ? 1 : 0,
                    deposits: saved.depositLock,
                    bets: saved.lockedBets,
                    duels: saved.lockedDuels,
                    sends: saved.sendLock,
                    userFields: {
                        withdrawLock: saved.withdrawLock,
                        depositLock: saved.depositLock,
                        lockedBets: saved.lockedBets,
                        lockedDuels: saved.lockedDuels,
                        sendLock: saved.sendLock,
                    }
                });

                redis.pub.publish("userLock", pubData, function(err, sent){

                    if(err || !sent)
                        sent = 0;

                    return res.json({sent: sent, field: field, value: value});
                });

            });
        });

        app.post('/moderate/change-role', requireModeratorLevel, requirePostData(), function(req, res){

            var body = req.body;
            var newRole = body.new_role;
            var oldRole = body.old_role;
            var openId = body.openId;

            if(newRole === 'admin')
                return res.status(404).send("cannot change role to admin");

            var allRoles = _.values(SecretConfig.ROLES);

            var validNewRole = _.indexOf(allRoles, newRole) >= 0;
            var validOldRole = _.indexOf(allRoles, oldRole) >= 0;

            if(!validNewRole || !validOldRole)
                return res.status(404).send("invalid new or old role "+newRole);

            var failed = false;

            models.User.findOne({openId: openId}).then(function(targetUser){

                if(targetUser.role !== oldRole)
                {
                    failed = true;
                    return res.status(404).send("user role changed! "+targetUser.role+" / "+oldRole);
                }

                targetUser.role = newRole;

                return targetUser.save();
            }).then(function(saved){

                if(failed)
                    return;

                user.addNote(openId, "Changed User role from "+oldRole+" to "+newRole, function(err, noteResponse){

                    if(err || !noteResponse || !noteResponse.notes)
                        return res.status(404).send("could not save user note");

                    return res.json({
                        new_role: newRole,
                        notes: noteResponse.notes
                    });
                });
            });
        });

        app.post('/moderate/add-note', requireModeratorLevel, requirePostData('openId'), function(req, res){
            var body = req.body;

            if(!body.note)
            {
                return res.status(404).send("empty_note");
            }

            var openId = body.openId;
            var user = req.user;

            // current user adds note to target openId user
            user.addNote(openId, body.note).then(function(saved){
                console.log(saved);
                return models.Note.findUserNotes(openId);
            }).then(function(notes){
                return res.json({
                    openId: openId,
                    notes: notes,
                });
            }).catch(function(err){
                logger.error(err);
                return res.status(404).send(err);
            });

        });

        app.post('/credit', requireModeratorLevel, requirePostData(), function(req, res) {
    		var user = req.user;
    		var adminOpenId = user.openId;
    		var body = req.body;

    		var creditOpenId = body.openId;
    		if(typeof creditOpenId !== 'string' || !creditOpenId){
    			return res.status(400).send("Invalid Open ID");
    		}

    		var skinxvalue = parseInt(body.skinxvalue);
    		if(typeof skinxvalue !== 'number' || isNaN(skinxvalue) || skinxvalue%1 !== 0){
    			return res.status(400).send("Invalid SkinX Value");
    		}

    		var value = parseInt(body.value);
    		if(typeof value !== 'number' || isNaN(value) || value%1 !== 0){
    			return res.status(400).send("Invalid Value");
    		}

    		var depositValue = parseInt(body.depositValue);
            var isRefund = (body.isRefund === 'true') ? true : false;
    		if(typeof depositValue !== 'number' || isNaN(depositValue) || depositValue < 0 || depositValue%1 !== 0){
    			return res.status(400).send("Invalid Deposit Value");
    		}

    		models.User.credit(creditOpenId, skinxvalue, value, depositValue, function(err, response){
    			if(err){
    				logger.info("ERROR: [" + adminOpenId + ", " + creditOpenId + ", " + skinxvalue + ", " + value + ", " + depositValue + "]");
    				logger.info(err);
    				return res.status(500).send("Failed updating User Table");
    			}

    			if(response.nModified === 0){
    				logger.info("ERROR: [" + adminOpenId + ", " + creditOpenId + ", " + skinxvalue + ", " + value + ", " + depositValue + "]");
    				return res.status(400).send("Failed to credit User");
    			}

                var data = {
    				creditor: adminOpenId,
    				openId: creditOpenId,
                    skinxvalue: skinxvalue,
                    value: value,
                    depositValue: depositValue,
                    isRefund: isRefund
                };

    			models.Credit.create(data, function(err, creditDb) {

    				if(err){
    					logger.info("ERROR: [" + creditOpenId + ", " + openId + ", " + skinxvalue + ", " + value + ", " + depositValue + "]");
    					logger.info(err);
    					return res.status(500).send("Failed updating Credit Table");
    				}

    				if(!creditDb){
    					logger.info("ERROR: [" + creditOpenId + ", " + openId + ", " + skinxvalue + ", " + value + ", " + depositValue + "]");
    					return res.status(500).send("Failed updating Credit Table");
    				}

                    var creditNote = [];

                    creditNote.push((isRefund) ? "Refunded" : "Credited");
                    creditNote.push("with");
                    if(skinxvalue !== 0)
                        creditNote.push("[SkinxValue: "+skinxvalue+"]");
                    if(value !== 0)
                        creditNote.push("[Value: "+value+"]");
                    if(depositValue !== 0)
                        creditNote.push("[DepositValue: "+depositValue+"]");

                    creditNote = creditNote.join(" ");

                    user.addNote(creditOpenId, creditNote, function(err, data){
                        return res.status(200).json({
                            notes: data.notes
                        });
                    });
    			});

    		});
    	});

    	app.post('/mute', requireModeratorLevel, requirePostData(), function(req, res){

    		var body = req.body;
    		var openId = body.openId;
    		if(typeof openId !== 'string' || !openId){
    			return res.status(400).send("Invalid Open ID");
    		}

    		models.User.muteUser(openId).then(function(response){

    			return res.status(200).send();

    		}).catch(function(err){
                logger.info("ERROR: [" + openId + "]");
                logger.info(err);
                return res.status(400).send();
            });
    	});

    	app.post('/unmute', requireModeratorLevel, requirePostData(), function(req, res){

            var body = req.body;
    		var openId = body.openId;
    		if(typeof openId !== 'string' || !openId){
    			return res.status(400).send("Invalid Open ID");
    		}

    		models.User.unmuteUser(openId).then(function(response){

    			return res.status(200).send();
    		}).catch(function(err){
                logger.info("ERROR: [" + openId + "]");
                logger.info(err);
                return res.status(400).send();
            });
    	});

    }
}());
