const binance = require('./binance');
const bx = require('./bx');
const kucoin = require('./kucoin');
const huobi = require('./huobi');

const exchange = {
    binance: binance,
    bx: bx,
    kucoin: kucoin,
    huobi: huobi,
    new: function (obj) {
        obj(this);
    }
};

console.log('exchange model created');

module.exports = exchange;