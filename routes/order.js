var express = require('express');
var router = express.Router();
var binance = require('../model/binance');
var bx = require('../model/bx');

var ExchangeError = require("../model/exchangeerror");

module.exports = function (exchange) {
    /* GET home page. */

    router.post('/', function (req, res, next) {
        if (exchange[req.query.exchange]) {
            exchange[req.query.exchange].newOrder(req, res, next);
        } else {
            return next(new ExchangeError('Exchange not found!', 9000));
        }
    });

    router.delete('/', function (req, res, next) {
        if (exchange[req.query.exchange]) {
            exchange[req.query.exchange].deleteOrder(req, res, next);
        } else {
            return next(new ExchangeError('Exchange not found!', 9000));
        }
    });

    return router;
};
