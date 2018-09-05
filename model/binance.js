const request = require("request-promise-native");
const CryptoJS = require("crypto-js");
const getval = require("./getval");

const ExchangeError = require("./exchangeError");

async function getValue(req) {
  let secret_key = await getval.get(req.session.address + ":" + req.query.exchange + ":SECRET_KEY", req.session.sign);
  if (secret_key === null) {
    return {err: new ExchangeError('Required Secret_key.', 7000)};
  }

  let api_key = await getval.get(req.session.address + ":" + req.query.exchange + ":API_KEY", req.session.sign);
  if (api_key === null) {
    return {err: new ExchangeError('Required API_KEY.', 7001)};
  }

  return {
    api_key: api_key,
    secret_key: secret_key
  }
}


function genSignature(form, secret_key) {
  let queryString = [];
  if (form !== undefined) {
    for (let key in form) {
      if (form.hasOwnProperty(key)) {
        if (key !== 'timestamp' && key !== 'signature') {
          queryString.push(key + '=' + form[key]);
        }
      }
    }
  }

  queryString.push('timestamp=' + form.timestamp);
  queryString = queryString.join('&');

  form.signature = CryptoJS.HmacSHA256(queryString, secret_key).toString(CryptoJS.enc.Hex);
}

function deleteField(form) {
  let optionals = ['newClientOrderId', 'stopPrice', 'icebergQty', 'newOrderRespType'];
  for (let i = 0; i < optionals.length; i++) {
    if (form[optionals[i]] === undefined) {
      delete form[optionals[i]];
    }
  }
}

let obj = {
  depth: async (symbolName, next) => {
    let options = {
      method: 'GET',
      url: 'https://api.binance.com/api/v1/depth',
      qs: {
        symbol: symbolName
      },
      headers:
        {
          'Cache-Control': 'no-cache'
        },
      json: true,
      resolveWithFullResponse: true,
    };

    try {
      const response = await request(options);
      const body = response.body;
      const result = response.body;
      result.lastUpdateId = new Date().getTime();

      if (response.statusCode !== 200) {
        switch (body.code) {
          case -1100:
            next(new ExchangeError('Illegal characters found in a parameter.', 1100));
            return;
          case -1112:
            next(new ExchangeError('No orders on book for symbol.', 1112));
            return;
          case -1121:
            next(new ExchangeError('Invalid symbol.', 1121));
            return;
          case -2008:
            next(new ExchangeError('Invalid Api-Key ID.', 2008));
            return;
          case -2014:
            next(new ExchangeError('API-key format invalid.', 2014));
            return;
          default:
            next(new ExchangeError('An unknown error occured while processing the request.', 1000));
            return;
        }
      } else {
        return result;
      }
    } catch (e) {
      next(e);
    }
  },

  newOrder: async function (req, res, next) {
    const symbol = await require('../model/symbol');

    let symbolName;

    const key = await getValue(req);

    if (key.hasOwnProperty('err')) {
      return next(key.err);
    }

    try {
      symbolName = symbol.carboneum[req.body.symbol].binance;
    } catch (e) {
      symbolName = req.body.symbol;
    }
    let form = {
      symbol: symbolName,
      side: req.body.side,
      type: req.body.type,
      timeInForce: req.body.timeInForce,
      quantity: req.body.quantity,
      price: req.body.price,
      newClientOrderId: req.body.newClientOrderId,
      stopPrice: req.body.stopPrice,
      icebergQty: req.body.icebergQty,
      newOrderRespType: req.body.newOrderRespType,
      recvWindow: req.body.recvWindow,
      timestamp: req.body.timestamp + '000',
      signature: ''
    };

    deleteField(form);
    genSignature(form, key.secret_key);

    let options = {
      method: 'POST',
      url: 'https://api.binance.com/api/v3/order',
      headers:
        {
          'Cache-Control': 'no-cache',
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-MBX-APIKEY': key.api_key
        },
      form: form,
      json: true
    };

    console.log(form);

    request(options, function (error, response, body) {
      if (error) {
        //todo handle this error
        return next(error);
      }

      body.symbol = symbol.binance[body.symbol];

      if (response.statusCode !== 200) {
        if (body.code === -1100) {
          return next(new ExchangeError('Illegal characters found in a parameter.', 1100));
        } else if (body.code === -1021) {
          return next(new ExchangeError('Timestamp for this request is outside of the recvWindow.', 1021));
        } else if (body.code === -1022) {
          return next(new ExchangeError('Signature for this request is not valid.', 1022));
        } else if (body.code === -1115) {
          return next(new ExchangeError('Invalid timeInForce.', 1115));
        } else if (body.code === -1116) {
          return next(new ExchangeError('Invalid orderType.', 1116));
        } else if (body.code === -1117) {
          return next(new ExchangeError('Invalid side.', 1117));
        } else if (body.code === -1121) {
          return next(new ExchangeError('Invalid symbol.', 1121));
        } else if (body.code === -2014) {
          return next(new ExchangeError('API-key format invalid.', 2014));
        } else if (body.code === -2008) {
          return next(new ExchangeError('Invalid Api-Key ID.', 2008));
        } else {
          return next(new ExchangeError('An unknown error occured while processing the request.', 1000));
        }
      }

      res.send({
        "symbol": body.symbol,
        "orderId": `${body.orderId}`,
        "clientOrderId": body.clientOrderId,
        "transactTime": body.transactTime,
        "price": body.price,
        "origQty": body.origQty,
        "executedQty": body.executedQty,
        "status": body.status,
        "timeInForce": body.timeInForce,
        "type": body.type,
        "side": body.side
      });
    });

  },

  allOrder: async function (req, res, next) {
    const symbol = await require('../model/symbol');

    let symbolName;

    const key = await getValue(req);

    try {
      symbolName = symbol.carboneum[req.query.symbol].binance;
    } catch (e) {
      symbolName = req.query.symbol;
    }

    let arrBinance = [];

    let qs = {
      symbol: symbolName,
      timestamp: req.query.timestamp + '000'
    };

    genSignature(qs, key.secret_key);
    let options = {
      method: 'GET',
      url: 'https://api.binance.com/api/v3/allOrders',
      headers:
        {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-MBX-APIKEY': key.api_key
        },
      qs: qs,
      json: true
    };
    request(options, function (error, response, body) {
      if (error) {
        //todo handle this error
        return next(error);
      }

      for (let i in body) {
        if (body.hasOwnProperty(i)) {
          body[i].symbol = symbol.binance[body[i].symbol];
        }
      }
      if (response.statusCode !== 200) {
        if (body.code === -1100) {
          return next(new ExchangeError('Illegal characters found in a parameter.', 1100));
        } else if (body.code === -1015) {
          return next(new ExchangeError('Too many new orders.', 1015));
        } else if (body.code === -1021) {
          return next(new ExchangeError('Timestamp for this request is outside of the recvWindow.', 1021));
        } else {
          return next(new ExchangeError('An unknown error occured while processing the request.', 1000));
        }
      }
      for (let i in body) {
        if (body.hasOwnProperty(i)) {
          arrBinance.push({
            "symbol": body[i].symbol,
            "orderId": body[i].orderId.toString(),
            "clientOrderId": body[i].clientOrderId,
            "price": body[i].price,
            "origQty": body[i].origQty,
            "executedQty": body[i].executedQty,
            "status": body[i].status,
            "timeInForce": body[i].timeInForce,
            "type": body[i].type,
            "side": body[i].side,
            "stopPrice": body[i].stopPrice,
            "icebergQty": body[i].icebergQty,
            "time": body[i].time,
            "isWorking": body[i].isWorking
          });
        }
      }

      res.send(arrBinance);
    });

  },
  deleteOrder: async function (req, res, next) {
    const symbol = await require('../model/symbol');

    let symbolName;

    const key = await getValue(req);

    try {
      symbolName = symbol.carboneum[req.query.symbol].binance;
    } catch (e) {
      symbolName = req.query.symbol;
    }

    let qs = {
      symbol: symbolName,
      orderId: req.query.orderId,
      timestamp: req.query.timestamp + '000'
    };

    genSignature(qs, key.secret_key);
    let options = {
      method: 'DELETE',
      url: 'https://api.binance.com/api/v3/order',
      headers:
        {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-MBX-APIKEY': key.api_key
        },
      qs: qs,
      json: true
    };

    request(options, function (error, response, body) {
      if (error) {
        //todo handle this error
        return next(error);
      }

      body.symbol = symbol.binance[body.symbol];

      if (response.statusCode !== 200) {
        if (body.code === -1100) {
          return next(new ExchangeError('Illegal characters found in a parameter.', 1100));
        } else if (body.code === -2011) {
          return next(new ExchangeError('Unknown order sent.', 2011));
        } else {
          return next(new ExchangeError('An unknown error occured while processing the request.', 1000));
        }
      }

      res.send({
        "symbol": body.symbol,
        "origClientOrderId": body.origClientOrderId,
        "orderId": `${body.orderId}`,
        "clientOrderId": body.clientOrderId
      });
    });

  },

  account: async function (req, res, next) {
    let qs = {
      timestamp: req.query.timestamp + '000'
    };

    const key = await getValue(req);

    genSignature(qs, key.secret_key);
    let options = {
      method: 'GET',
      url: 'https://api.binance.com/api/v3/account',
      headers:
        {
          'Content-Type': 'application/x-www-form-urlencoded',
          'X-MBX-APIKEY': key.api_key
        },
      qs: qs,
      json: true
    };
    request(options, function (error, response, body) {
      if (error) {
        //todo handle this error
        return next(error);
      }

      if (response.statusCode !== 200) {
        if (body.code === -1100) {
          return next(new ExchangeError('Illegal characters found in a parameter.', 1100));
        } else if (body.code === -1102) {
          return next(new ExchangeError('Mandatory parameter was not sent, was empty/null, or malformed.', 1102));
        } else {
          return next(new ExchangeError('An unknown error occured while processing the request.', 1000));
        }
      }

      res.send(body);
    });

  },

  ticker: async function (symbolName, next) {
    let options = {
      method: 'GET',
      url: 'https://api.binance.com/api/v3/ticker/price',
      qs: {
        symbol: symbolName
      },
      headers:
        {
          'Cache-Control': 'no-cache'
        },
      json: true
    };

    try {
      const body = await request(options);

      return {
        exchange: 'binance',
        price: body.price
      };
    } catch (e) {
      next(e);
    }
  }

};

module.exports = obj;