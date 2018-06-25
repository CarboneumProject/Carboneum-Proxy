const express = require('express');
const router = express.Router();

const getval = require("../model/getval");
const exchange = require("../model/exchange");


const ExchangeError = require("../model/exchangeerror");

router.post('/', function(req, res, next) {
    if (exchange[req.query.exchange]) {
        getval.key(req, res, next);
    } else {
        return next(new ExchangeError('Exchange not found!', 9000));
    }
});

module.exports = router;