var redis = require("redis"),
    client = redis.createClient();

let obj = {
    key: function (req, res) {
        client.set(req.query.exchange + ":API_KEY", req.body.API_KEY, redis.print);
        client.set(req.query.exchange + ":SECRET_KEY", req.body.SECRET_KEY, redis.print);

        res.send("Success to added");

    }
};

module.exports = obj;