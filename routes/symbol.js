const express = require('express');
const Decimal = require('decimal.js');

const redis = require('../model/redis');
const exchange = require('../model/exchange');
const ExchangeError = require("../model/exchangeError");

Decimal.set({toExpPos: 9e15, toExpNeg: -9e15});
const router = express.Router();

router.get('/list', async (req, res, next) => {
  const symbol = await require('../model/symbol');

  if (req.query.exchange) {
    if (symbol[req.query.exchange]) {
      let result = [];

      for (let k in symbol[req.query.exchange]) {
        if (symbol[req.query.exchange].hasOwnProperty(k)) {
          result.push(symbol[req.query.exchange][k]);
        }
      }

      res.send(result);
    } else {
      next(new ExchangeError('Exchange not found!', 9000));
    }
  } else {
    res.send(Object.keys(symbol['carboneum']));
  }
});

router.get('/listWithPrice', async (req, res, next) => {
  const symbol = await require('../model/symbol');
  let symbols = false;

  try {
    symbols = JSON.parse(req.query.symbols);
  } catch (e) {
    return next(e);
  }

  const cacheKey = `listWithPrice:1:${req.query.exchange}:${req.query.symbols}`;

  const cacheResult = await redis.getAsync(cacheKey);

  if (cacheResult) {
    return res.send(JSON.parse(cacheResult));
  }

  if (req.query.exchange) {
    if (exchange[req.query.exchange]) {
      let symbolList = [];
      let klineListPromise = [];
      let result = [];

      for (let i = 0; i < symbols.length; i++) {
        if (symbol['carboneum'].hasOwnProperty(symbols[i])) {
          if (symbol['carboneum'][symbols[i]].hasOwnProperty(req.query.exchange)) {
            symbolList.push({
              symbol: symbols[i],
              exchangeName: symbol['carboneum'][symbols[i]][req.query.exchange]
            });
          }
        }
      }

      for (let i = 0; i < symbolList.length; i++) {
        klineListPromise.push(
          exchange[req.query.exchange].klines(
            symbolList[i].exchangeName, '1d', undefined, undefined, 7, next
          ));
      }

      try {
        const klineList = await Promise.all(klineListPromise);

        for (let i = 0; i < klineList.length; i++) {
          const lastDateClose = klineList[i][klineList[i].length - 1][4];
          const beforeLastDateClose = klineList[i][klineList[i].length - 2][4];

          // noinspection JSUnresolvedFunction
          result.push({
            symbol: symbolList[i].symbol,
            change: (new Decimal(lastDateClose).minus(new Decimal(beforeLastDateClose))).toString(),
            price: klineList[i],
          });
        }

        redis.setex(cacheKey, 60, JSON.stringify(result));
        res.send(result);
      } catch (e) {
        return next(e)
      }
    } else {
      next(new ExchangeError('Exchange not found!', 9000));
    }
  } else {
    res.send(Object.keys(symbol['carboneum']));
  }
});

module.exports = router;