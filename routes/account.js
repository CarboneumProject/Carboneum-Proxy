var express = require('express');
var router = express.Router();

var exchange = require('../model/exchange');
var ExchangeError = require("../model/exchangeerror");


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

module.exports = router;