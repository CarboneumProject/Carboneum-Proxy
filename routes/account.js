var express = require('express');
var router = express.Router();
var binance = require('../model/binance');
var bx = require('../model/bx');

var ExchangeError = require("../model/exchangeerror");


module.exports = function (exchange) {
    /* GET home page. */
    router.get('/', function(req, res, next) {
        if (exchange[req.query.exchange]) {
            exchange[req.query.exchange].account(req, res, next);
        } else {
            return next(new ExchangeError('Exchange not found!', 9000));
        }
    });

    router.post('/', function(req, res, next) {
        if (exchange[req.query.exchange]) {
            exchange[req.query.exchange].account(req, res, next);
        } else {
            return next(new ExchangeError('Exchange not found!', 9000));
        }
    });

    return router;
};