const express = require('express');
const router = express.Router();
const exchange = require('../model/exchange');
const ExchangeError = require("../model/exchangeError");

router.get('/', function (req, res, next) {
    if (exchange[req.query.exchange]) {
        exchange[req.query.exchange].depth(req, res, next);
    } else {
        return next(new ExchangeError('Exchange not found!', 9000));
    }
});

module.exports = router;