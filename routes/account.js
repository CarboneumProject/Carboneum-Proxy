const express = require('express');
const router = express.Router();

const exchange = require('../model/exchange');
const ExchangeError = require("../model/exchangeerror");


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