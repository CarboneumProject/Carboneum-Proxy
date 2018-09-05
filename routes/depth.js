const express = require('express');
const router = express.Router();
const exchange = require('../model/exchange');
const ExchangeError = require("../model/exchangeError");

router.get('/', async (req, res, next) => {
    const symbol = await require('../model/symbol');

    if (exchange[req.query.exchange]) {
      if (symbol['carboneum'].hasOwnProperty(req.query.symbol) && symbol['carboneum'][req.query.symbol].hasOwnProperty(req.query.exchange)) {
        const exchangeName = symbol['carboneum'][req.query.symbol][req.query.exchange];
        const depth = await exchange[req.query.exchange].depth(exchangeName, next);

        if (depth) {
          res.send(depth);
        }
      } else {
        return next(new ExchangeError('Invalid symbol.', 1121));
      }
    } else {
      return next(new ExchangeError('Exchange not found!', 9000));
    }
  }
);

module.exports = router;