const redis = require('../model/redis');

const request = require("request-promise-native");

const symbol = {carboneum: {}};

async function getBinanceSymbol() {
  let binanceSymbol = await redis.getAsync('binanceSymbol');

  if (binanceSymbol) {
    symbol.binance = JSON.parse(binanceSymbol);
  } else {
    try {
      const res = await request({
        method: 'GET',
        url: 'https://api.binance.com/api/v1/exchangeInfo',
        headers:
          {
            'Cache-Control': 'no-cache'
          },
        json: true
      });

      symbol.binance = {};

      // noinspection JSUnresolvedVariable
      res.symbols.forEach(
        (item) =>
          symbol.binance[item['symbol']] = `${item['baseAsset']}/${item['quoteAsset']}`.toUpperCase()
      );

      redis.setex('binanceSymbol', 3600, JSON.stringify(symbol.binance));
    } catch (e) {
      console.error(e);
    }
  }
}

async function getBxSymbol() {
  let bxSymbol = await redis.getAsync('bxSymbol');

  if (bxSymbol) {
    symbol.bx = JSON.parse(bxSymbol);
  } else {
    try {
      const res = await request({
        method: 'GET',
        url: 'https://bx.in.th/api/',
        headers:
          {
            'Cache-Control': 'no-cache'
          },
        json: true
      });

      symbol.bx = {};

      Object.entries(res).forEach(([key, val]) => {
        symbol.bx[key] = `${val['secondary_currency']}/${val['primary_currency']}`.toUpperCase()
      });

      redis.setex('bxSymbol', 3600, JSON.stringify(symbol.bx));
    } catch (e) {
      console.error(e);
    }
  }
}

async function getHuobiSymbol() {
  let huobiSymbol = await redis.getAsync('huobiSymbol');

  if (huobiSymbol) {
    symbol.huobi = JSON.parse(huobiSymbol);
  } else {
    try {
      const res = await request({
        method: 'GET',
        url: 'https://api.huobi.pro/v1/common/symbols',
        headers:
          {
            'Cache-Control': 'no-cache'
          },
        json: true
      });

      symbol.huobi = {};

      res.data.forEach(
        (item) =>
          symbol.huobi[item['symbol']] = `${item['base-currency']}/${item['quote-currency']}`.toUpperCase()
      );

      redis.setex('huobiSymbol', 3600, JSON.stringify(symbol.huobi));
    } catch (e) {
      console.error(e);
    }
  }
}

async function getKucoinSymbol() {
  let kucoinSymbol = await redis.getAsync('kucoinSymbol');

  if (kucoinSymbol) {
    symbol.kucoin = JSON.parse(kucoinSymbol);
  } else {
    try {
      const res = await request({
        method: 'GET',
        url: 'https://api.kucoin.com/v1/market/open/symbols',
        headers:
          {
            'Cache-Control': 'no-cache'
          },
        json: true
      });

      symbol.kucoin = {};

      res.data.forEach(
        (item) =>
          symbol.kucoin[item['symbol']] = `${item['coinType']}/${item['coinTypePair']}`.toUpperCase()
      );

      redis.setex('kucoinSymbol', 3600, JSON.stringify(symbol.kucoin));
    } catch (e) {
      console.error(e);
    }
  }
}

module.exports = (async () => {
  let globalSymbol = await redis.getAsync('globalSymbol');

  if (globalSymbol) {
    return JSON.parse(globalSymbol);
  } else {
    // noinspection JSCheckFunctionSignatures
    await Promise.all([getBinanceSymbol(), getBxSymbol(), getHuobiSymbol(), getKucoinSymbol()]);
    let carboneumSymbol = await redis.getAsync('carboneumSymbol');

    if (carboneumSymbol) {
      symbol.carboneum = JSON.parse(carboneumSymbol);
    } else {
      try {
        await Object.entries(symbol).forEach(([exchange, pairObject]) => {
          Object.entries(pairObject).forEach(([exchangeSymbol, carboneumSymbol]) => {
            if (!symbol.carboneum.hasOwnProperty(carboneumSymbol)) {
              symbol.carboneum[carboneumSymbol] = {}
            }

            symbol.carboneum[carboneumSymbol][exchange] = exchangeSymbol;
          });
        });

        redis.setex('carboneumSymbol', 3600, JSON.stringify(symbol.carboneum));
        redis.setex('globalSymbol', 3600, JSON.stringify(symbol));
      } catch (e) {
        console.error(e);
      }
    }
  }

  return symbol;
})();