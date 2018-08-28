const redis = require("redis"),
  client = redis.createClient();
const request = require("request-promise-native");

const {promisify} = require('util');
const getAsync = promisify(client.get).bind(client);

const symbol = {carboneum: {}};

async function getBinanceSymbol() {
  let binanceSymbol = await getAsync('binanceSymbol');

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

      client.setex('binanceSymbol', 3600, JSON.stringify(symbol.binance));
    } catch (e) {
      console.error(e);
    }
  }
}

async function getBxSymbol() {
  let bxSymbol = await getAsync('bxSymbol');

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

      client.setex('bxSymbol', 3600, JSON.stringify(symbol.bx));
    } catch (e) {
      console.error(e);
    }
  }
}

async function getHuobiSymbol() {
  let huobiSymbol = await getAsync('huobiSymbol');

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

      client.setex('huobiSymbol', 3600, JSON.stringify(symbol.huobi));
    } catch (e) {
      console.error(e);
    }
  }
}

async function getKucoinSymbol() {
  let kucoinSymbol = await getAsync('kucoinSymbol');

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

      client.setex('kucoinSymbol', 3600, JSON.stringify(symbol.kucoin));
    } catch (e) {
      console.error(e);
    }
  }
}

module.exports = (async () => {
  let globalSymbol = await getAsync('globalSymbol');

  if (globalSymbol) {
    return JSON.parse(globalSymbol);
  } else {
    // noinspection JSCheckFunctionSignatures
    await Promise.all([getBinanceSymbol(), getBxSymbol(), getHuobiSymbol(), getKucoinSymbol()]);
    let carboneumSymbol = await getAsync('carboneumSymbol');

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

        client.setex('carboneumSymbol', 3600, JSON.stringify(symbol.carboneum));
        client.setex('globalSymbol', 3600, JSON.stringify(symbol));
      } catch (e) {
        console.error(e);
      }
    }
  }

  return symbol;
})();