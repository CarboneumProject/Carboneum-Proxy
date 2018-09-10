const Decimal = require('decimal.js');
const express = require('express');

const router = express.Router();
const exchange = require('../model/exchange');
const ExchangeError = require("../model/exchangeError");

Decimal.set({toExpPos: 9e15, toExpNeg: -9e15});

router.get('/', async function (req, res, next) {
  const symbol = await require('../model/symbol');

  if (exchange[req.query.exchange]) {
    if (symbol['carboneum'].hasOwnProperty(req.query.symbol) && symbol['carboneum'][req.query.symbol].hasOwnProperty(req.query.exchange)) {
      const ticker = await exchange[req.query.exchange].ticker(symbol['carboneum'][req.query.symbol][req.query.exchange], next);
      res.send(ticker);
    } else {
      return next(new ExchangeError('Invalid symbol.', 1121));
    }
  } else {
    return next(new ExchangeError('Exchange not found!', 9000));
  }
});

router.get('/compare', async function (req, res, next) {
  const symbol = await require('../model/symbol');

  if (symbol['carboneum'].hasOwnProperty(req.query.symbol)) {
    let tickerList = await Promise.all(
      Object.keys(symbol['carboneum'][req.query.symbol]).map(async ex => {
        try {
          return await exchange[ex].ticker(symbol['carboneum'][req.query.symbol][ex], next);
        } catch (e) {
          console.warn(e.stack);
        }
      }));

    tickerList = tickerList
      .filter(x => x)
      .sort((a, b) => (a.price > b.price) ? 1 : ((b.price > a.price) ? -1 : 0));

    tickerList = tickerList.map(item => {
      // noinspection JSUnresolvedFunction
      item['change'] = (new Decimal(item.price).minus(new Decimal(tickerList[0].price))).toString();
      return item;
    });
    res.send(tickerList);
  } else {
    return next(new ExchangeError('Invalid symbol.', 1121));
  }
});

module.exports = router;