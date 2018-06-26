const request = require("request");
// noinspection SpellCheckingInspection
const CryptoJS = require("crypto-js");
const moment = require('moment');
// noinspection SpellCheckingInspection
const getval = require("./getval");

const symbol = require("./symbol");
const ExchangeError = require("./exchangeerror");

async function getvalue(req) {
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

function genSignature(method, host_url, path, form, nonce, secret_key, api_key) {
    let queryString = [];
    if (form !== undefined) {
        for (let key in form) {
            if (form.hasOwnProperty(key)) {
                if (key !== 'Timestamp' && key !== 'Signature' && key !== 'AccessKeyId') {
                    queryString.push(key + '=' + form[key]);
                    console.log(key);
                    console.log(form[key]);
                }
            }
        }
    }
    queryString.push('AccessKeyId=' + api_key);
    queryString.push('Timestamp=' + nonce);
    queryString.sort();
    queryString = queryString.join('&');

    let payload = [method, host_url, path, queryString];
    console.log(payload);
    payload = payload.join('\n');
    console.log(payload);

    console.log(queryString);
    return CryptoJS.HmacSHA256(payload, secret_key).toString(CryptoJS.enc.Base64);
}

let obj = {
    depth: function (req, res, next) {

        let symbolName;
        let nonce = new Date().getTime();

        try {
            symbolName = symbol.carboneum[req.query.symbol].huobi;
        } catch (e) {
            symbolName = req.query.symbol;
        }

        let depth = {
            "lastUpdateId": nonce,
            "bids": [],
            "asks": []
        };

        let options = {
            method: 'GET',
            url: 'https://api.huobi.pro/market/depth',
            qs: {
                symbol: symbolName,
                type: 'percent10'
            },
            json: true
        };

        request(options, function (error, response, body) {
            if (error) {
                //todo handle this error
                return next(error);
            }

            if (body.status === 'error') {
                if (body['err-code'].substring(0, 11) === 'bad-request') {
                    return next(new ExchangeError('Invalid topic.', 9500));
                } else {
                    return next(new ExchangeError('An unknown error occured while processing the request.', 1000));
                }
            }

            for (let i in body.tick.bids) {
                if (body.tick.bids.hasOwnProperty(i)) {
                    depth.bids.push([
                        body.tick.bids[i][0].toString(),
                        body.tick.bids[i][1].toString()
                    ]);
                }
            }

            for (let i in body.tick.asks) {
                if (body.tick.asks.hasOwnProperty(i)) {
                    depth.asks.push([
                        body.tick.asks[i][0].toString(),
                        body.tick.asks[i][1].toString()
                    ]);
                }
            }
            console.log(body);
            res.send(depth);
        });

    },

    newOrder: async function (req, res, next) {

        let symbolName;
        const key = await getvalue(req);

        if (key.hasOwnProperty('err')) {
            return next(key.err);
        }

        let nonce = moment().toISOString().substring(0, 19);

        console.log(req.body.side);

        if (req.body.side === 'sell' || req.body.side === 'SELL') {
            req.body.side = 'sell-limit'
        } else {
            req.body.side = 'buy-limit'
        }
        console.log(req.body.side);

        try {
            symbolName = symbol.carboneum[req.body.symbol].huobi;
        } catch (e) {
            symbolName = req.body.symbol;
        }

        const signature = genSignature('POST', 'api.huobi.pro', '/v1/order/orders/place', {
            symbol: symbolName,
            Signature: req.query.Signature,
            SignatureMethod: 'HmacSHA256',
            SignatureVersion: '2',
            AccessKeyId: key.api_key,
        }, encodeURIComponent(nonce), key.secret_key, key.api_key);

        let form = {
            AccessKeyId: key.api_key,
            Signature: signature,
            SignatureMethod: 'HmacSHA256',
            Timestamp: nonce,
            symbol: symbolName,
            SignatureVersion: '2'
        };

        let options = {
            method: 'POST',
            url: 'https://api.huobi.pro/v1/order/orders/place',
            qs: form,
            body:
                {
                    source: req.body.source,
                    amount: req.body.quantity,
                    price: req.body.price,
                    "account-id": process.env.HUOBI_ACC,
                    type: req.body.side,
                    symbol: symbolName
                },
            json: true
        };


        request(options, function (error, response, body) {
            if (error) {
                //todo handle this error
                return next(error);
            }

            if (body.status === 'error') {
                if (body['err-code'].substring(0, 23) === 'api-signature-not-valid') {
                    return next(new ExchangeError('Signature for this request is not valid.', 1022));
                } else if (body['err-code'].substring(0, 41) === 'account-frozen-balance-insufficient-error') {
                    return next(new ExchangeError('Trade account balance is not enough.', 9501));
                } else if (body['err-code'].substring(0, 41) === 'require-account-id') {
                    return next(new ExchangeError('Paramemter `account-id` is required.', 9502));
                } else {
                    return next(new ExchangeError('An unknown error occured while processing the request.', 1000));
                }
            }

            console.log(req.body.side);
            if (req.body.side === 'sell-limit') {
                req.body.side = req.body.side.substring(0, 4)
            } else {
                req.body.side = req.body.side.substring(0, 3)
            }

            console.log(req.body.side);


            res.send({
                "symbol": req.body.symbol,
                "orderId": body.data.toString(),
                "clientOrderId": null,
                "transactTime": Date.parse(nonce) / 1000,
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

        let symbolName;
        const key = await getvalue(req);

        if (key.hasOwnProperty('err')) {
            return next(key.err);
        }

        let nonce = moment().toISOString().substring(0, 19);

        try {
            symbolName = symbol.carboneum[req.query.symbol].huobi;
        } catch (e) {
            symbolName = req.query.symbol;
        }

        const signature = genSignature('GET', 'api.huobi.pro', '/v1/order/orders', {
            symbol: symbolName,
            Signature: req.query.Signature,
            states: 'submitted',
            SignatureMethod: 'HmacSHA256',
            SignatureVersion: '2',
            AccessKeyId: key.api_key,
        }, encodeURIComponent(nonce), key.secret_key, key.api_key);

        let toHuobi = [];

        console.log(signature);

        let form = {
            AccessKeyId: key.api_key,
            Signature: signature,
            SignatureMethod: 'HmacSHA256',
            Timestamp: nonce,
            symbol: symbolName,
            SignatureVersion: '2',
            states: 'submitted',
        };
        let options = {
            method: 'GET',
            url: 'https://api.huobi.pro/v1/order/orders',
            qs: form,
            json: true
        };
        request(options, function (error, response, body) {
            if (error) {
                //todo handle this error
                return next(error);
            }

            if (body.status === 'error') {
                if (body['err-code'].substring(0, 23) === 'api-signature-not-valid') {
                    return next(new ExchangeError('Signature for this request is not valid.', 1022));
                } else {
                    return next(new ExchangeError('An unknown error occured while processing the request.', 1000));
                }
            }

            for (let i in body.data) {
                if (body.data.hasOwnProperty(i)) {
                    body.data[i].symbol = symbol.huobi[body.data[i].symbol];
                    body.data[i].type = body.data[i].type.toUpperCase();

                    if (body.data[i].type === "SELL-LIMIT") {
                        body.data[i].type = body.data[i].type.substring(0, 4)
                    } else {
                        body.data[i].type = body.data[i].type.substring(0, 3)
                    }
                    toHuobi.push({
                        "symbol": body.data[i].symbol,
                        "orderId": body.data[i].id.toString(),
                        "clientOrderId": null,
                        "price": body.data[i].price,
                        "origQty": body.data[i].amount,
                        "executedQty": null,
                        "status": null,
                        "timeInForce": null,
                        "type": null,
                        "side": body.data[i].type,
                        "stopPrice": null,
                        "icebergQty": null,
                        "time": body.data[i]['created-at'],
                        "isWorking": null
                    });
                }
            }

            console.log(body);
            res.send(toHuobi);
        });

    },

    deleteOrder: async function (req, res, next) {

        const key = await getvalue(req);

        if (key.hasOwnProperty('err')) {
            return next(key.err);
        }

        let nonce = moment().toISOString().substring(0, 19);

        console.log(req);
        let orderId = req.query.orderId;

        const signature = genSignature('POST', 'api.huobi.pro', `/v1/order/orders/${orderId}/submitcancel`, {
            Signature: req.query.Signature,
            SignatureMethod: 'HmacSHA256',
            SignatureVersion: '2',
            AccessKeyId: key.api_key,
        }, encodeURIComponent(nonce), key.secret_key, key.api_key);


        console.log(signature);

        let form = {
            AccessKeyId: key.api_key,
            Signature: signature,
            SignatureMethod: 'HmacSHA256',
            Timestamp: nonce,
            SignatureVersion: '2',
        };

        let options = {
            method: 'POST',
            url: `https://api.huobi.pro/v1/order/orders/${orderId}/submitcancel`,
            form: form,
            json: true
        };
        request(options, function (error, response, body) {
            if (error) {
                //todo handle this error
                return next(error);
            }

            if (body.status === 'error') {
                if (body['err-code'].substring(0, 24) === 'order-orderstate-error') {
                    return next(new ExchangeError('The order state is error.', 9500));
                } else if (body['err-code'].substring(0, 23) === 'api-signature-not-valid') {
                    return next(new ExchangeError('Signature for this request is not valid.', 1022));
                } else {
                    return next(new ExchangeError('An unknown error occured while processing the request.', 1000));
                }
            }

            console.log(body);
            res.send({
                "symbol": null,
                "origClientOrderId": null,
                "orderId": `${body.data}`,
                "clientOrderId": null
            });
        });

    },

    account: async function (req, res, next) {

        const key = await getvalue(req);

        if (key.hasOwnProperty('err')) {
            return next(key.err);
        }

        let nonce = moment().toISOString().substring(0, 19);


        const signature = genSignature('GET', 'api.huobi.pro', `/v1/account/accounts/${process.env.HUOBI_ACC}/balance`, {
            Signature: req.query.Signature,
            SignatureMethod: 'HmacSHA256',
            SignatureVersion: '2',
            AccessKeyId: key.api_key,
        }, encodeURIComponent(nonce), key.secret_key, key.api_key);

        console.log(signature);

        let form = {
            AccessKeyId: key.api_key,
            Signature: signature,
            SignatureMethod: 'HmacSHA256',
            Timestamp: nonce,
            SignatureVersion: '2'
        };
        let accHb = {
            "makerCommission": null,
            "takerCommission": null,
            "buyerCommission": null,
            "sellerCommission": null,
            "canTrade": null,
            "canWithdraw": null,
            "canDeposit": null,
            "updateTime": Date.parse(nonce) / 1000,
            "balances": []
        };
        console.log(accHb);

        let options = {
            method: 'GET',
            url: `https://api.huobi.pro/v1/account/accounts/${process.env.HUOBI_ACC}/balance`,
            qs: form,
            json: true
        };

        request(options, function (error, response, body) {
            if (error) {
                //todo handle this error
                return next(error);
            }

            console.log(body);

            if (body.status === 'error') {
                if (body['err-code'].substring(0, 23) === 'api-signature-not-valid') {
                    return next(new ExchangeError('Signature for this request is not valid.', 1022));
                } else {
                    return next(new ExchangeError('An unknown error occured while processing the request.', 1000));
                }
            }

            let temp = {};
            for (let i in body.data.list) {
                if (body.data.list.hasOwnProperty(i)) {
                    if (i % 2 === 1) {
                        // noinspection JSUnresolvedVariable
                        temp["locked"] = body.data.list[i].balance;
                        accHb.balances.push(temp);
                        temp = {};
                    } else {
                        // noinspection JSUnresolvedVariable
                        temp = {
                            "asset": body.data.list[i].currency.toUpperCase(),
                            "free": body.data.list[i].balance,
                        };
                    }
                }
            }
            console.log(body);
            res.send(accHb);
        });

    }

};

module.exports = obj;