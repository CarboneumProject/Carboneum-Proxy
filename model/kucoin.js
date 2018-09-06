const request = require("request-promise-native");
const CryptoJS = require("crypto-js");

const getval = require("./getval");
const ExchangeError = require("./exchangeError");


async function getvalue(req) {
  let secret_key = await getval.get(req.session.address + ":" + req.query.exchange + ":SECRET_KEY", req.session.sign);
  if (secret_key === null) {
    return {err: new ExchangeError('Required Secret_key.', 7000)};
  }

  let api_key = await getval.get(req.session.address + ":" + req.query.exchange + ":API_KEY", req.session.sign);
  if (api_key === null) {
    return {err: new ExchangeError('Required API_KEY.', 7001)};
  }

  // noinspection JSUnresolvedVariable
  return {
    api_key: api_key,
    secret_key: secret_key
  }
}


function genSignature(form, path, nonce, secret_key) {
  let queryString = [];
  if (form !== undefined) {
    for (let key in form) {
      if (form.hasOwnProperty(key)) {
        if (key !== 'timestamp' && key !== 'signature') {
          queryString.push(key + '=' + form[key]);
        }
      }
    }
    queryString.sort();
    queryString = queryString.join('&');
  } else {
    queryString = ''
  }
  let strForSign = path + '/' + nonce + '/' + queryString;
  let signatureStr = new Buffer(strForSign).toString('base64');

  console.log(strForSign);
  console.log(signatureStr);

  console.log(queryString);
  return CryptoJS.HmacSHA256(signatureStr, secret_key).toString(CryptoJS.enc.Hex);
}

let obj = {
  depth: async (symbolName, next) => {
    let depthKc = {
      "lastUpdateId": new Date().getTime(),
      "bids": [],
      "asks": []
    };

    let options = {
      method: 'GET',
      url: 'https://api.kucoin.com/v1/open/orders',
      qs: {
        symbol: symbolName
      },
      json: true
    };

    try {
      const body = await request(options);

      if (body.success === false) {
        if (body['msg'].substring(0, 16) === 'SYMBOL NOT FOUND') {
          next(new ExchangeError('Invalid symbol.', 1121));
        } else {
          next(new ExchangeError('An unknown error occured while processing the request.', 1000));
        }

        return;
      }

      // noinspection JSUnresolvedVariable
      for (let i in body.data.BUY) {
        // noinspection JSUnresolvedVariable
        if (body.data.BUY.hasOwnProperty(i)) {
          // noinspection JSUnresolvedVariable
          body.data.BUY[i] = `${body.data.BUY[i]}`;
          // noinspection JSUnresolvedVariable
          if (body.data.BUY.hasOwnProperty(i)) {
            // noinspection JSUnresolvedVariable
            depthKc.bids.push([
              body.data.BUY[i][0],
              body.data.BUY[i][1]
            ]);
          }
        }
      }

      // noinspection JSUnresolvedVariable
      for (let i in body.data.SELL) {
        // noinspection JSUnresolvedVariable
        if (body.data.SELL.hasOwnProperty(i)) {
          // noinspection JSUnresolvedVariable
          body.data.SELL[i] = `${body.data.SELL[i]}`;
          // noinspection JSUnresolvedVariable
          if (body.data.SELL.hasOwnProperty(i)) {
            // noinspection JSUnresolvedVariable
            depthKc.asks.push([
              body.data.SELL[i][0],
              body.data.SELL[i][1]
            ]);
          }
        }
      }

      return depthKc;
    } catch (e) {
      next(e);
    }
  },

  newOrder: async function (req, res, next) {
    const symbol = await require('../model/symbol');

    let symbolName;
    let nonce = new Date().getTime();

    const key = await getvalue(req);

    if (key.hasOwnProperty('err')) {
      return next(key.err);
    }

    try {
      symbolName = symbol.carboneum[req.body.symbol].kucoin;
    } catch (e) {
      symbolName = req.body.symbol;
    }

    let form = {
      type: req.body.side.toUpperCase(),
      price: req.body.price,
      amount: req.body.quantity,
      symbol: symbolName
    };

    const signature = genSignature({
      symbol: symbolName,
      type: req.body.side.toUpperCase(),
      price: req.body.price,
      amount: req.body.quantity
    }, '/v1/order', nonce, key.secret_key);

    let options = {
      method: 'POST',
      url: 'https://api.kucoin.com/v1/order',
      headers:
        {
          'Cache-Control': 'no-cache',
          'KC-API-SIGNATURE': signature,
          'KC-API-NONCE': nonce,
          'KC-API-KEY': key.api_key
        },
      form: form,
      json: true
    };
    request(options, function (error, response, body) {
      if (error) {
        //todo handle this error
        return next(error);
      }

      if (body.success === false) {
        if (body.msg.substring(0, 29) === 'Signature verification failed') {
          return next(new ExchangeError('Invalid Signature.', 1022));
        } else if (body.msg.substring(0, 17) === 'Invalid operation') {
          return next(new ExchangeError('This operation is not supported.', 1020));
        } else if (body.msg.substring(0, 17) === 'Insufficient balance') {
          return next(new ExchangeError('Check your balance.', 9510));
        } else {
          return next(new ExchangeError('An unknown error occured while processing the request.', 1000));
        }
      }

      res.send({
        "symbol": req.body.symbol,
        "orderId": body.data.orderOid,
        "clientOrderId": null,
        "transactTime": req.body.timestamp,
        "price": req.body.price,
        "origQty": req.body.quantity,
        "executedQty": null,
        "status": null,
        "timeInForce": null,
        "type": null,
        "side": req.body.side.toUpperCase()
      });
    });

  },

  allOrder: async function (req, res, next) {
    const symbol = await require('../model/symbol');

    let symbolName;
    let nonce = new Date().getTime();

    const key = await getvalue(req);

    if (key.hasOwnProperty('err')) {
      return next(key.err);
    }

    try {
      symbolName = symbol.carboneum[req.query.symbol].kucoin;
    } catch (e) {
      symbolName = req.query.symbol;
    }

    const signature = genSignature({
      symbol: symbolName
    }, '/v1/order/active', nonce, key.secret_key);

    let toKucoin = [];

    let qs = {
      symbol: symbolName
    };

    let options = {
      method: 'GET',
      url: 'https://api.kucoin.com/v1/order/active',
      headers:
        {
          'Cache-Control': 'no-cache',
          'KC-API-SIGNATURE': signature,
          'KC-API-NONCE': nonce,
          'KC-API-KEY': key.api_key
        },
      qs: qs,
      json: true
    };
    request(options, function (error, response, body) {
      if (error) {
        //todo handle this error
        return next(error);
      }

      if (body.success === false) {
        if (body.msg.substring(0, 29) === 'Signature verification failed') {
          return next(new ExchangeError('Invalid Signature.', 1022));
        } else if (body.msg.substring(0, 17) === 'Invalid operation') {
          return next(new ExchangeError('This operation is not supported.', 1020));
        } else {
          return next(new ExchangeError('An unknown error occured while processing the request.', 1000));
        }
      }

      // noinspection JSUnresolvedVariable
      for (let i in body.data.SELL) {
        // noinspection JSUnresolvedVariable
        if (body.data.SELL.hasOwnProperty(i)) {
          // noinspection JSUnresolvedVariable
          toKucoin.push({
            "symbol": req.query.symbol,
            "orderId": body.data.SELL[i][5],
            "clientOrderId": null,
            "price": body.data.SELL[i][2].toString(),
            "origQty": body.data.SELL[i][3].toString(),
            "executedQty": null,
            "status": null,
            "timeInForce": null,
            "type": null,
            "side": body.data.SELL[i][1],
            "stopPrice": null,
            "icebergQty": null,
            "time": body.data.SELL[i][0],
            "isWorking": null
          });
        }
      }

      // noinspection JSUnresolvedVariable
      for (let i in body.data.BUY) {
        // noinspection JSUnresolvedVariable
        if (body.data.BUY.hasOwnProperty(i)) {
          // noinspection JSUnresolvedVariable
          toKucoin.push({
            "symbol": req.query.symbol,
            "orderId": body.data.BUY[i][5],
            "clientOrderId": null,
            "price": body.data.BUY[i][2],
            "origQty": body.data.BUY[i][3],
            "executedQty": null,
            "status": null,
            "timeInForce": null,
            "type": null,
            "side": body.data.BUY[i][1],
            "stopPrice": null,
            "icebergQty": null,
            "time": body.data.BUY[i][0],
            "isWorking": null
          });
        }
      }

      res.send(toKucoin);
    });

  },

  deleteOrder: async function (req, res, next) {
    const symbol = await require('../model/symbol');

    let symbolName;
    let nonce = new Date().getTime();

    const key = await getvalue(req);

    if (key.hasOwnProperty('err')) {
      return next(key.err);
    }


    try {
      symbolName = symbol.carboneum[req.query.symbol].kucoin;
    } catch (e) {
      symbolName = req.query.symbol;
    }

    const signature = genSignature({
      symbol: symbolName,
      type: 'BUY',
      orderOid: req.query.orderId,
    }, '/v1/order/detail', nonce, key.secret_key);

    let options = {
      method: 'GET',
      url: 'https://api.kucoin.com/v1/order/detail',
      headers:
        {
          'Cache-Control': 'no-cache',
          'KC-API-SIGNATURE': signature,
          'KC-API-NONCE': nonce,
          'KC-API-KEY': key.api_key
        },
      qs: {
        symbol: symbolName,
        type: 'BUY',
        orderOid: req.query.orderId,
      },
      json: true
    };

    request(options, function (error, response, body) {


      let symbolName;
      try {
        symbolName = symbol.carboneum[req.query.symbol].kucoin;
      } catch (e) {
        symbolName = req.query.symbol;
      }
      let orderType;

      if (body.data === null) {
        orderType = 'SELL';
      } else {
        orderType = 'BUY';
      }

      let form = {
        type: orderType,
        symbol: symbolName,
        orderOid: req.query.orderId,
      };


      const signature = genSignature({
        type: orderType,
        symbol: symbolName,
        orderOid: req.query.orderId,
      }, '/v1/cancel-order', nonce, key.secret_key);

      let options = {
        method: 'POST',
        url: 'https://api.kucoin.com/v1/cancel-order',
        headers:
          {
            'Cache-Control': 'no-cache',
            'KC-API-SIGNATURE': signature,
            'KC-API-NONCE': nonce,
            'KC-API-KEY': key.api_key
          },
        form: form,
        json: true
      };
      request(options, function (error, response, body) {
        if (error) {
          //todo handle this error
          return next(error);
        }

        if (body.success === false) {
          if (body.msg.substring(0, 29) === 'Signature verification failed') {
            return next(new ExchangeError('Invalid Signature.', 1022));
          } else if (body.msg.substring(0, 17) === 'Invalid operation') {
            return next(new ExchangeError('This operation is not supported.', 1020));
          } else {
            return next(new ExchangeError('An unknown error occured while processing the request.', 1000));
          }
        }

        res.send({
          "symbol": req.query.symbol,
          "origClientOrderId": null,
          "orderId": req.query.orderId,
          "clientOrderId": null
        });
      });
    });
  },

  account: async function (req, res, next) {

    let nonce = new Date().getTime();

    const key = await getvalue(req);

    if (key.hasOwnProperty('err')) {
      return next(key.err);
    }

    const signature = genSignature({}, '/v1/account/balances', nonce, key.secret_key);

    let accKc = {
      "makerCommission": null,
      "takerCommission": null,
      "buyerCommission": null,
      "sellerCommission": null,
      "canTrade": null,
      "canWithdraw": null,
      "canDeposit": null,
      "updateTime": nonce,
      "balances": []
    };

    let options = {
      method: 'GET',
      url: 'https://api.kucoin.com/v1/account/balances',
      headers:
        {
          'Cache-Control': 'no-cache',
          'KC-API-SIGNATURE': signature,
          'KC-API-NONCE': nonce,
          'KC-API-KEY': key.api_key
        },
      json: true
    };

    request(options, function (error, response, body) {
      if (error) {
        //todo handle this error
        return next(error);
      }

      if (body.success === false) {
        if (body.msg.substring(0, 29) === 'Signature verification failed') {
          return next(new ExchangeError('Invalid Signature.', 1022));
        } else if (body.msg.substring(0, 17) === 'Invalid operation') {
          return next(new ExchangeError('This operation is not supported.', 1020));
        } else {
          return next(new ExchangeError('An unknown error occured while processing the request.', 1000));
        }
      }

      // noinspection JSUnresolvedVariable
      for (let i in body.data.datas) {
        // noinspection JSUnresolvedVariable
        if (body.data.datas.hasOwnProperty(i)) {
          // noinspection JSUnresolvedVariable
          accKc.balances.push({
            "asset": body.data.datas[i].coinType,
            "free": `${body.data.datas[i].balance}`,
            "locked": `${body.data.datas[i].freezeBalance}`
          });
        }
      }

      res.send(accKc);
    });

  },

  ticker: async function (symbolName, next) {
    let options = {
      method: 'GET',
      url: 'https://api.kucoin.com/v1/open/tick',
      qs: {
        symbol: symbolName
      },
      json: true
    };

    try {
      const body = await request(options);

      // noinspection JSUnresolvedVariable
      return {
        exchange: 'kucoin',
        price: body.data.lastDealPrice.toString()     // Open price
      };
    } catch (e) {
      return next(e);
    }
  },

  klines: async (symbolName, interval, startTime, endTime, limit, next) => {
    let qs = {
      symbol: symbolName,
      type: interval.replace('m', 'min'),
      from: startTime,
      endTime: endTime,
      limit,
    };

    for (let q in qs) {
      if (qs.hasOwnProperty(q)) {
        if (qs[q] === undefined) {
          delete qs[q]
        }
      }
    }

    const options = {
      method: 'GET',
      url: 'https://api.kucoin.com/v1/open/kline',
      qs,
      headers:
        {
          'Cache-Control': 'no-cache'
        },
      json: true
    };

    try {
      const data = await request(options);
      let result = [];

      for (let i=0; i<data.data.length; i++) {
        const item = data.data[i];

        result.push([
          data.ts,
          item['open'].toString(),
          item['high'].toString(),
          item['low'].toString(),
          item['close'].toString(),
          item['vol'].toString(),
          data.ts,
          item['amount'].toString(),
          item['count'],
          '',
          '',
          '',
        ]);
      }

      return result;
    } catch (e) {
      next(e);
    }
  },

  allowInterval: (interval) => {
    const intervalList = [
      '1m',
      '3m',
      '5m',
      '15m',
      '30m',
      '1h',
      '2h',
      '4h',
      '6h',
      '8h',
      '12h',
      '1d',
      '3d',
      '1w',
      '1M',
    ];

    return intervalList.indexOf(interval) !== -1;
  }
};

module.exports = obj;