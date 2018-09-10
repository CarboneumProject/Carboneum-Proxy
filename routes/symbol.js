const express = require('express');
const Decimal = require('decimal.js');
const request = require("request-promise-native");

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
  const offset = parseInt(req.query.offset || 0);
  const limit = offset + parseInt(req.query.limit || 10);

  const cacheKey = `listWithPrice:1:${req.query.exchange}:${offset}:${limit}`;

  const cacheResult = await redis.getAsync(cacheKey);

  if (cacheResult) {
    return res.send(JSON.parse(cacheResult));
  }

  if (req.query.exchange) {
    if (symbol[req.query.exchange] && exchange[req.query.exchange]) {
      let symbolList = [];
      let result = [];

      for (let symbolName in symbol[req.query.exchange]) {
        if (symbol[req.query.exchange].hasOwnProperty(symbolName)) {
          symbolList.push({
            symbol: symbol[req.query.exchange][symbolName],
            exchangeName: symbolName
          });
        }
      }

      symbolList = symbolList.slice(offset, limit);

      for (let i = 0; i < symbolList.length; i++) {
        const klines = await exchange[req.query.exchange].klines(symbolList[i].exchangeName, '1d', undefined, undefined, 7, next);

        // noinspection JSUnresolvedFunction
        result.push({
          symbol: symbolList[i].symbol,
          change: (new Decimal(klines[klines.length - 1][4]).minus(new Decimal(klines[klines.length - 2][4]))).toString(),
          price: klines,
        });
      }

      redis.setex(cacheKey, 60, JSON.stringify(result));
      res.send(result);
    } else {
      next(new ExchangeError('Exchange not found!', 9000));
    }
  } else {
    res.send(Object.keys(symbol['carboneum']));
  }
});

module.exports = router;