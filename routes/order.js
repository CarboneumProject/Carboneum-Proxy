const express = require('express');
// noinspection JSUnresolvedFunction
const router = express.Router();

const exchange = require('../model/exchange');
const ExchangeError = require("../model/exchangeError");


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

module.exports = router;
