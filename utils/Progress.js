;(function() {
    'use strict';

    var ProgressBar = require('progress');

    module.exports = function(total, title) {
        var bar = new ProgressBar('[:bar] :percent :etas --- '+title, {
            complete: '|',
            incomplete: '.',
            width: 20,
            total: total
        });

        return bar;
    };
}());
