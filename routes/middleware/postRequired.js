;(function() {
    'use strict';

    module.exports = function(input)
    {
        return function(req, res, next) {

    		if(!req.body){
    			return res.status(400).send('Invalid Request');
    		}

    		if(input && !req.body[input])
                return res.status(400).send('Invalid Request');

            next();
        };
    }

}());
