const {promisify} = require('util');

const redis = require('redis').createClient(
  process.env.REDISPORT || '6379',
  process.env.REDISHOST || '127.0.0.1',
  {
    'auth_pass': process.env.REDISKEY,
  }
);
redis.getAsync = promisify(redis.get).bind(redis);
redis.hgetAsync = promisify(redis.hget).bind(redis);
redis.hmgetAsync = promisify(redis.hmget).bind(redis);
redis.setAsync = promisify(redis.set).bind(redis);
module.exports = redis;