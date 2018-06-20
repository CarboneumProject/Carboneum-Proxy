var binance = require('./binance');
var bx = require('./bx');
var kucoin = require('./kucoin');
var huobi = require('./huobi');

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