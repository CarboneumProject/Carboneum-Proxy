var express = require('express');
var router = express.Router();

var getval = require("../model/getval");


var ExchangeError = require("../model/exchangeerror");

/* GET home page. */

module.exports = function (exchange) {
    /* GET home page. */
    router.post('/', function(req, res, next) {
        if (exchange[req.query.exchange]) {
            getval.key(req, res, next);
        } else {
            return next(new ExchangeError('Exchange not found!', 9000));
        }
    });

    return router;
};