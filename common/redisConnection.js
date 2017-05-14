var redis = require('redis'),
    redisClient = redis.createClient({'host': process.env.HOST || '127.0.0.1'});

 module.exports = redisClient;
