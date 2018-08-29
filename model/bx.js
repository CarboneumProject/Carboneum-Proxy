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

  queryString.push(form.key + form.nonce);
  queryString = queryString.join('');

  form.signature = CryptoJS.SHA256(queryString + secret_key).toString(CryptoJS.enc.Hex);
}

let obj = {
  depth: async (symbolName, next) => {
    let options = {
      method: 'GET',
      url: 'https://bx.in.th/api/orderbook/',
      qs: {
        pairing: symbolName
      },
      headers:
        {
          'Cache-Control': 'no-cache'
        },
      json: true
    };

    try {
      const body = await request(options);
      body.lastUpdateId = new Date().getTime();
      return body;
    } catch (e) {
      next(e);
    }
  },

  newOrder: async function (req, res, next) {
    const symbol = await require('../model/symbol');

    const key = await getValue(req);

    if (key.hasOwnProperty('err')) {
      return next(key.err);
    }

    let form = {
      key: key.api_key,
      nonce: req.body.timestamp + '00000000000',
      signature: '',
      pairing: symbol.carboneum[req.body.symbol].bx,
      type: req.body.side.toLowerCase(),
      amount: req.body.quantity,
      rate: req.body.price
    };

    genSignature(form, key.secret_key);

    let options = {
      method: 'POST',
      url: 'https://bx.in.th/api/order',
      headers:
        {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
      form: form,
      json: true
    };

    request(options, function (error, response, body) {
      if (error) {
        //todo handle this error
        return next(error);
      }

      if (body.error !== null) {
        if (body.error.substring(0, 32) === 'You must enter a valid price per') {
          return next(new ExchangeError('Invalid Price.', 9001));
        } else if (body.error.substring(0, 22) === 'You must enter a valid') {
          return next(new ExchangeError('Invalid Quantity.', 9002));
        } else if (body.error.substring(0, 33) === 'Amount entered in more than your ') {
          return next(new ExchangeError('Amount entered in more than your available balance.', 9003));
        } else if (body.error.substring(0, 18) === 'Invalid trade type') {
          return next(new ExchangeError('Invalid side.', 1117));
        } else if (body.error.substring(0, 13) === 'Invalid Nonce') {
          return next(new ExchangeError('Invalid Nonce.', 9004));
        } else {
          return next(new ExchangeError('An unknown error occured while processing the request.', 1000));
        }
      }

      res.send({
        "symbol": req.body.symbol,
        "orderId": body.order_id.toString(),
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

    const key = await getValue(req);

    if (key.hasOwnProperty('err')) {
      return next(key.err);
    }

    let form = {
      key: key.api_key,
      nonce: req.query.timestamp + '00000000000',
      pairing: symbol.carboneum[req.query.symbol].bx
    };

    let toBinance = [];

    genSignature(form, key.secret_key);
    let options = {
      method: 'POST',
      url: 'https://bx.in.th/api/getorders/',
      headers:
        {
          'Content-Type': 'application/x-www-form-urlencoded'
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
        if (body.error.substring(0, 28) === 'You did not set any API key.') {
          return next(new ExchangeError('Invalid Api-Key ID.', 2008));
        } else if (body.error.substring(0, 13) === 'Invalid Nonce') {
          return next(new ExchangeError('Invalid Nonce.', 9004));
        } else {
          return next(new ExchangeError('An unknown error occured while processing the request.', 1000));
        }
      }

      // noinspection JSUnresolvedVariable
      for (let i in body.orders) {
        // noinspection JSUnresolvedVariable
        if (body.orders.hasOwnProperty(i)) {
          // noinspection JSUnresolvedVariable
          body.orders[i].pairing_id = symbol.bx[body.orders[i].pairing_id];

          // noinspection JSUnresolvedVariable
          toBinance.push({
            "symbol": body.orders[i].pairing_id,
            "orderId": body.orders[i].order_id.toString(),
            "clientOrderId": null,
            "price": body.orders[i].rate.toString(),
            "origQty": body.orders[i].amount.toString(),
            "executedQty": null,
            "status": null,
            "timeInForce": null,
            "type": null,
            "side": body.orders[i].order_type.toUpperCase(),
            "stopPrice": null,
            "icebergQty": null,
            "time": Date.parse(body.orders[i].date) / 1000,
            "isWorking": null
          });
        }
      }

      res.send(toBinance);
    });

  },
  deleteOrder: async function (req, res, next) {
    const symbol = await require('../model/symbol');

    const key = await getValue(req);

    if (key.hasOwnProperty('err')) {
      return next(key.err);
    }

    let form = {
      key: key.api_key,
      nonce: req.query.timestamp + '00000000000',
      pairing: symbol.carboneum[req.query.symbol].bx,
      order_id: req.query.orderId
    };

    genSignature(form, key.secret_key);
    let options = {
      method: 'POST',
      url: 'https://bx.in.th/api/cancel/',
      headers:
        {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
      form: form,
      json: true
    };

    request(options, function (error, response, body) {
      if (error) {
        //todo handle this error
        return next(error);
      }

      if (body.error !== null) {
        if (body.error.substring(0, 32) === 'Order not found') {
          return next(new ExchangeError('Unknown order sent.', 2011));
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

  },
  account: async function (req, res, next) {

    const key = await getValue(req);

    if (key.hasOwnProperty('err')) {
      return next(key.err);
    }

    let form = {
      key: key.api_key,
      nonce: req.query.timestamp + '000'
    };

    let accBx = {
      "makerCommission": null,
      "takerCommission": null,
      "buyerCommission": null,
      "sellerCommission": null,
      "canTrade": null,
      "canWithdraw": null,
      "canDeposit": null,
      "updateTime": parseInt(req.query.timestamp),
      "balances": []

    };

    genSignature(form, key.secret_key);

    let options = {
      method: 'POST',
      url: 'https://bx.in.th/api/balance/',
      headers:
        {
          'Content-Type': 'application/x-www-form-urlencoded'
        },
      form: form,
      json: true
    };
    request(options, function (error, response, body) {
      if (error) {
        //todo handle this error
        return next(error);
      }

      if (body.error === false) {
        if (body.error.substring(0, 15) === 'Order not found') {
          return next(new ExchangeError('Mandatory parameter was not sent, was empty/null, or malformed.', 1102));
        } else {
          return next(new ExchangeError('An unknown error occured while processing the request.', 1000));
        }
      }

      // noinspection JSUnresolvedVariable
      for (let i in body.balance) {
        // noinspection JSUnresolvedVariable
        if (body.balance.hasOwnProperty(i)) {
          // noinspection JSUnresolvedVariable
          accBx.balances.push({
            "asset": i,
            "free": body.balance[i].available,
            "locked": body.balance[i].orders
          });
        }
      }

      res.send(accBx);
    });

  },

  ticker: async function (symbolName, next) {
    let options = {
      method: 'GET',
      url: 'https://bx.in.th/api/trade/',
      qs: {
        pairing: symbolName
      },
      headers:
        {
          'Cache-Control': 'no-cache'
        },
      json: true
    };

    try {
      const body = await request(options);

      // noinspection JSUnresolvedVariable
      if (body && body.trades) {
        let data = body.trades[body.trades.length - 1];

        return {
          exchange: 'bx',
          price: data.rate
        };
      } else {
        next(new ExchangeError('An unknown error occured while processing the request.', 1000));
      }
    } catch (e) {
      next(e);
    }
  }

};

module.exports = obj;