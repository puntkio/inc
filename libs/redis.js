;(function() {

  'use strict';

  const connectRedis = require('connect-redis');
  const redisClient = require('redis').createClient;
  const expressSession = require('express-session');

  const logger = require('./logger').main();
  const config = require('../config');

  class Redis {

      constructor(emitter)
      {
          if(emitter && emitter.emit)
          {
              this.emit = emitter.emit.bind(emitter);
          }
          else
          {
            logger.warn("Redis EventEmitter not available.");
          }

          this.pub = null;
          this.sub = null;

      }

      client() {

        if(!this.pub)
        {
            this.pub = redisClient(config.get('redis.port'), config.get('redis.host'), {no_ready_check: true, auth_pass: config.get('redis.password')});
            this.pub.on('connect', () => {
                logger.info("Redis Publish OK");
                this.emit('redis.pub.connect');
            });

            this.pub.on('error', (e) => {
                logger.info("--- Error in redis publish client ---");
                logger.error(e);
                this.emit('redis.pub.error', e);
            });
        }

        if(!this.sub)
        {
            this.sub = redisClient(config.get('redis.port'), config.get('redis.host'), {no_ready_check: true, detect_buffers: true, auth_pass: config.get('redis.password')});
            this.sub.on('connect', ()=>{
                logger.info("Redis Subscribe OK");
                this.emit('redis.sub.connect');
            });

            this.sub.on('error', (e)=>{
                logger.info("--- Error in redis subscribe client ---");
                logger.error(e);
                this.emit('redis.sub.error', e);
            });

            this.sub.on('message', (channel, message)=>{
                this.emit('redis.sub.message', channel, message);
            });
        }

        return {pub: this.pub, sub: this.sub};
    }

    store() {
        let redisStore = connectRedis(expressSession);

        let myRedisStore = new redisStore({
            host: config.get('redis.host'),
            port: config.get('redis.port'),
            client: this.client().pub
        });

        myRedisStore.on('connect', ()=>{
            logger.info("Redis Store OK");
            this.emit('redis.store.connect');
        });

        return myRedisStore;
    }

  }

  module.exports = function(app){
      return new Redis(app);
  };

}());
