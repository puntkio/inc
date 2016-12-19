'use strict';

const path = require('path');
const winston = require('winston');

const tsFormat = () => (new Date()).toLocaleTimeString();

module.exports = new class {
    main() {
        return new (winston.Logger)({
            transports: [
                new winston.transports.File({
                    level: 'info',
                    filename: path.join(__dirname, '../logs/app.log'),
                    handleExceptions: true,
                    json: true,
                    maxsize: 5242880, //5MB
                    maxFiles: 5,
                    colorize: false
                }),
                new winston.transports.Console({
                    level: 'debug',
                    handleExceptions: true,
                    humanReadableUnhandledException: true,
                    json: false,
                    colorize: true
                })
            ],
            exitOnError: false
        });
    }

    request() {
        let logger = new (winston.Logger)({
            transports: [
                new winston.transports.File({
                    level: 'info',
                    filename: `${__dirname}/../logs/requests.log`,
                    handleExceptions: true,
                    json: true,
                    maxsize: 5242880, //5MB
                    maxFiles: 5,
                    colorize: false
                })
            ],
            exitOnError: false
        });

        logger.stream = {
            write: function(message, encoding){
                logger.info(message);
            }
        };

        return logger;
    }
};
