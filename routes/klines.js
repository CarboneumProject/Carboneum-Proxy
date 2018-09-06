const express = require('express');
const router = express.Router();

const exchange = require('../model/exchange');
const ExchangeError = require("../model/exchangeError");


router.get('/', async (req, res, next) => {
  const symbol = await require('../model/symbol');

  if (exchange[req.query.exchange] && exchange[req.query.exchange].hasOwnProperty('klines')) {
    if (symbol['carboneum'].hasOwnProperty(req.query.symbol) && symbol['carboneum'][req.query.symbol].hasOwnProperty(req.query.exchange)) {
      const symbolName = symbol['carboneum'][req.query.symbol][req.query.exchange];
      const startTime = req.query.startTime;
      const endTime = req.query.endTime;
      const limit = req.query.limit;
      const interval = exchange[req.query.exchange].allowInterval(req.query.interval);

      if (interval !== false) {
        const ticker = await exchange[req.query.exchange].klines(
          symbolName,
          interval,
          startTime,
          endTime,
          limit,
          next
        );
        res.send(ticker);
      } else {
        return next(new ExchangeError('Invalid interval.', 1120));
      }
    } else {
      return next(new ExchangeError('Invalid symbol.', 1121));
    }
  } else {
    return next(new ExchangeError('Exchange not found!', 9000));
  }
});

module.exports = router;