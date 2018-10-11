const express = require('express');
const ExchangeError = require("../model/exchangeError");

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

module.exports = router;