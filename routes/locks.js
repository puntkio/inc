;(function() {
    'use strict';

    var _ = require('lodash');
    var Promise = require('bluebird');
    var roles = require('../utils/RolesHelper');
    var roleRequired = require('./middleware/roleRequired');
    var requirePostData = require('./middleware/postRequired');

    var requireModeratorLevel = roleRequired(roles.mod);
    var requireAdminLevel = roleRequired(roles.admin);

    module.exports = function(app, router) {
        var logger = app.logger;
        var models = app.models;
        var redis = app.redis.client();

        app.get('/lock/:scope?', function(req, res) {

            var user = req.user;
            var scope = req.params.scope || "";

            if (!user) {
                return res.status(404).send();
            }

            var role = user.role;
            if (role !== SecretConfig.ROLES.ADMIN) {
                return res.status(404).send();
            }

            request.post({
                url: SecretConfig.BOT_URL + path.join('/lock', scope),
                json: true
            }, function(error, response, body) {

                //Check error
                if (error) {
                    logger.info(error);
                    return res.status(500).send();
                }

                //Need 200 OK
                if (response.statusCode != 200) {
                    return res.status(500).send();
                }

                logger.info("Locked");
                return res.status(200).send("Locked" + ((scope) ? ": " + scope : ""));
            });
        });

        app.get('/unlock/:scope?', function(req, res) {

            var user = req.user;
            var scope = req.params.scope || "";

            if (!user) {
                return res.status(404).send();
            }

            var role = user.role;
            if (role !== SecretConfig.ROLES.ADMIN) {
                return res.status(404).send();
            }

            request.post({
                url: SecretConfig.BOT_URL + path.join('/unlock', scope),
                json: true
            }, function(error, response, body) {

                //Check error
                if (error) {
                    logger.info(error);
                    return res.status(500).send();
                }

                //Need 200 OK
                if (response.statusCode != 200) {
                    return res.status(500).send();
                }

                logger.info("Unlocked");
                return res.status(200).send("Unlocked" + ((scope) ? ": " + scope : ""));
            });
        });

        app.get('/bet-lock', function(req, res) {

            var user = req.user;
            if (!user) {
                return res.status(404).send();
            }

            var role = user.role;
            if (role !== SecretConfig.ROLES.ADMIN) {
                return res.status(404).send();
            }

            RedisClient.pub.publish("bet lock", "");

            logger.info("Bet Locked");
            site_locks.bets = true;
            return res.status(200).send("Bet Locked");
        });

        app.get('/bet-unlock', function(req, res) {

            var user = req.user;
            if (!user) {
                return res.status(404).send();
            }

            var role = user.role;
            if (role !== SecretConfig.ROLES.ADMIN) {
                return res.status(404).send();
            }

            RedisClient.pub.publish("bet unlock", "");

            logger.info("Bet Unlocked");
            site_locks.bets = false;
            return res.status(200).send("Bet Unlocked");
        });

        app.get('/duel-lock', function(req, res) {

            var user = req.user;
            if (!user) {
                return res.status(404).send();
            }

            var role = user.role;
            if (role !== SecretConfig.ROLES.ADMIN) {
                return res.status(404).send();
            }

            RedisClient.pub.publish("duel lock", "");

            logger.info("Duel Locked");
            site_locks.duels = true;
            return res.status(200).send("Duel Locked");
        });

        app.get('/duel-unlock', function(req, res) {

            var user = req.user;
            if (!user) {
                return res.status(404).send();
            }

            var role = user.role;
            if (role !== SecretConfig.ROLES.ADMIN) {
                return res.status(404).send();
            }

            RedisClient.pub.publish("duel unlock", "");

            logger.info("Duel Unlocked");
            site_locks.duels = false;
            return res.status(200).send("Duel Unlocked");
        });

        app.get('/send-lock', function(req, res) {

            var user = req.user;
            if (!user) {
                return res.status(404).send();
            }

            var role = user.role;
            if (role !== SecretConfig.ROLES.ADMIN) {
                return res.status(404).send();
            }

            RedisClient.pub.publish("sends-lock", "");

            logger.info("Sends Locked");
            site_locks.sends = true;
            return res.status(200).send("Sends Locked");
        });

        app.get('/send-unlock', function(req, res) {

            var user = req.user;
            if (!user) {
                return res.status(404).send();
            }

            var role = user.role;
            if (role !== SecretConfig.ROLES.ADMIN) {
                return res.status(404).send();
            }

            RedisClient.pub.publish("sends-unlock", "");

            logger.info("Sends Unlocked");
            site_locks.sends = false;
            return res.status(200).send("Sends Unlocked");
        });


        app.get('/bot-lock/:id/:action/:lock', function(req, res) {

            var user = req.user;
            var scope = req.params.scope || "";

            if (!user) {
                return res.status(404).send();
            }

            var role = user.role;
            if (role !== SecretConfig.ROLES.ADMIN) {
                return res.status(404).send();
            }

            request.get({
                url: SecretConfig.BOT_URL + '/bot-lock/' + req.params.id + "/" + req.params.action + "/" + req.params.lock,
                json: true
            }, function(error, response, body) {
                var ret = {
                    error: error,
                    sent: false
                };

                if (typeof body === 'object') {
                    ret = _.merge(ret, body);
                }

                return res.json(ret);
            });
        });

        app.get('/enable-autolock', function(req, res) {
            autoLock = true;
            site_locks.autolock = autoLock;
            return res.status(200).send("Auto Lock Enabled");
        });

        app.get('/disable-autolock', function(req, res) {
            autoLock = false;
            site_locks.autolock = autoLock;
            request.post({
                url: SecretConfig.BOT_URL + '/lock',
                json: true
            }, function(error, response, body) {

                //Check error
                if (error) {
                    logger.info(error);
                    return res.status(500).send();
                }

                //Need 200 OK
                if (response.statusCode != 200) {
                    logger.info("Failed to lock bots");
                    return res.status(500).send();
                }

                logger.info("Locked");
                return res.status(200).send("Auto Lock Disabled and Locked");
            });

        });

        app.get('/lock-status', function(req, res) {
            var user = req.user;
            if (!user) {
                return res.status(404).send();
            }

            var role = user.role;
            if (role !== SecretConfig.ROLES.ADMIN) {
                return res.status(404).send();
            }

            request.get({
                url: SecretConfig.BOT_URL + '/lock',
                json: true
            }, function(error, response, body) {

                if (!error && typeof body === "object") {
                    site_locks.autolock = autoLock;
                    return res.json({
                        error: false,
                        lock: {
                            middleman: body,
                            site: site_locks,
                        }
                    });
                } else if (error) {
                    return res.status(404).json({
                        error: error
                    });
                } else {
                    return res.status(404).json({
                        error: "Unknown response",
                        response: body
                    });
                }
            });
        });
    };
}());
