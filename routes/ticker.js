const Decimal = require('decimal.js');
const express = require('express');

const router = express.Router();
const exchange = require('../model/exchange');
const symbol = require('../model/symbol');
const ExchangeError = require("../model/exchangeError");

router.get('/', async function (req, res, next) {
    if (exchange[req.query.exchange]) {
        const ticker = await exchange[req.query.exchange].ticker(req, res, next);
        res.send(ticker);
    } else {
        return next(new ExchangeError('Exchange not found!', 9000));
    }
});

router.get('/compare', async function (req, res, next) {
    if (symbol.carboneum.hasOwnProperty(req.query.symbol)) {
        let tickerList = await Promise.all(
            Object.keys(symbol.carboneum[req.query.symbol]).map(async ex => {
                try {
                    return await exchange[ex].ticker(req, res, next);
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