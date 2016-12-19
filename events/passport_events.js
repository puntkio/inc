;(function() {
    'use strict';

    module.exports = function(app)
    {
        app.on("passport.serializeUser", function(user, done){
            done(null, user._id);
        });

        app.on("passport.deserializeUser", function(userId, done){
            console.log("Deserialize "+userId);

            app.models.User.findOne({_id: userId}, function(err, user) {

                if(err){
                    logger.info(err);
                    console.log(err);
                    return done(err);
                }
                
                done(null, user);
            });
        });
    }
}());
