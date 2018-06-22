var redis = require("redis"),
    client = redis.createClient();

const {promisify} = require('util');
const getAsync = promisify(client.get).bind(client);

let obj = {
    key: function (req, res) {
        client.set(req.session.address + ":" + req.query.exchange + ":API_KEY", req.body.API_KEY, redis.print);
        client.set(req.session.address + ":" + req.query.exchange + ":SECRET_KEY", req.body.SECRET_KEY, redis.print);
        console.log(req.session.address);
        res.send("Success to added");

    },
    get: async function (key) {
        return await getAsync(key);
    }
};

module.exports = obj;