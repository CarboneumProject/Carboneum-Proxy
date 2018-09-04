const {promisify} = require('util');

const redis = require('redis').createClient();
redis.getAsync = promisify(redis.get).bind(redis);
redis.setAsync = promisify(redis.set).bind(redis);
module.exports = redis;