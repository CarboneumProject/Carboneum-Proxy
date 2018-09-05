const {promisify} = require('util');

const redis = require('redis').createClient(6379, process.env.NODE_ENV === 'production'? '10.148.0.20': '127.0.0.1');
redis.getAsync = promisify(redis.get).bind(redis);
redis.setAsync = promisify(redis.set).bind(redis);
module.exports = redis;