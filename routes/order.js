var express = require('express');
var router = express.Router();

var exchange = require('../model/exchange');
var ExchangeError = require("../model/exchangeerror");


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
