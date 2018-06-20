var request = require("request");
var CryptoJS = require("crypto-js");
var moment = require('moment');

var symbol = require("./symbol");
var ExchangeError = require("./exchangeerror");

function genSignature(method, host_url, path, form, nonce) {
    let AccessKeyId = "c126a600-2ac33a4c-428422cd-ca6dd";
    let queryString = [];
    if (form !== undefined) {
        for (let key in form) {
            if (key !== 'Timestamp' && key !== 'Signature' && key !== 'AccessKeyId') {
                queryString.push(key + '=' + form[key]);
                console.log(key);
                console.log(form[key]);
            }
        }
    }
    queryString.push('AccessKeyId=' + AccessKeyId);
    queryString.push('Timestamp=' + nonce);
    queryString.sort();
    queryString = queryString.join('&');

    let payload = [method, host_url, path, queryString];
    console.log(payload);
    payload = payload.join('\n');
    console.log(payload);

    console.log(queryString);
    return CryptoJS.HmacSHA256(payload, process.env.HUOBI_SECRET_KEY).toString(CryptoJS.enc.Base64);
}

let obj = {
    depth: function (req, res, next) {

        let nonce = new Date().getTime();

        try {
            var symbolName = symbol.carboneum[req.query.symbol].huobi;
        } catch (e) {
            symbolName = req.query.symbol;
        }

        let depth = {
            "lastUpdateId": nonce,
            "bids": [],
            "asks": []
        };

        var options = {
            method: 'GET',
            url: 'https://api.huobi.pro/market/depth',
            qs: {
                symbol: symbolName,
                type: 'percent10'
            },
            json: true
        };

        request(options, function (error, response, body) {
            if (error) throw new Error(error);

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

    newOrder: function (req, res, next) {

        let nonce = moment().toISOString().substring(0, 19);

        console.log(req.body.side);

        if (req.body.side === 'sell' || req.body.side === 'SELL') {
            req.body.side = 'sell-limit'
        } else {
            req.body.side = 'buy-limit'
        }
        console.log(req.body.side);

        try {
            var symbolName = symbol.carboneum[req.body.symbol].huobi;
        } catch (e) {
            symbolName = req.body.symbol;
        }

        const signature = genSignature('POST', 'api.huobi.pro', '/v1/order/orders/place', {
            symbol: symbolName,
            Signature: req.query.Signature,
            SignatureMethod: 'HmacSHA256',
            SignatureVersion: '2',
            AccessKeyId: process.env.HUOBI_API_KEY,
        }, encodeURIComponent(nonce));

        let form = {
            AccessKeyId: process.env.HUOBI_API_KEY,
            Signature: signature,
            SignatureMethod: 'HmacSHA256',
            Timestamp: nonce,
            symbol: symbolName,
            SignatureVersion: '2'
        };

        var options = {
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
            if (error) throw new Error(error);

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

    allOrder: function (req, res, next) {
        let nonce = moment().toISOString().substring(0, 19);

        try {
            var symbolName = symbol.carboneum[req.query.symbol].huobi;
        } catch (e) {
            symbolName = req.query.symbol;
        }

        const signature = genSignature('GET', 'api.huobi.pro', '/v1/order/orders', {
            symbol: symbolName,
            Signature: req.query.Signature,
            states: 'submitted',
            SignatureMethod: 'HmacSHA256',
            SignatureVersion: '2',
            AccessKeyId: process.env.HUOBI_API_KEY,
        }, encodeURIComponent(nonce));

        let toHuobi = [];

        console.log(signature);

        let form = {
            AccessKeyId: process.env.HUOBI_API_KEY,
            Signature: signature,
            SignatureMethod: 'HmacSHA256',
            Timestamp: nonce,
            symbol: symbolName,
            SignatureVersion: '2',
            states: 'submitted',
        };
        var options = {
            method: 'GET',
            url: 'https://api.huobi.pro/v1/order/orders',
            qs: form,
            json: true
        };
        request(options, function (error, response, body) {
            if (error) throw new Error(error);

            if (body.status === 'error') {
                if (body['err-code'].substring(0, 23) === 'api-signature-not-valid') {
                    return next(new ExchangeError('Signature for this request is not valid.', 1022));
                } else {
                    return next(new ExchangeError('An unknown error occured while processing the request.', 1000));
                }
            }

            for (let i in body.data) {
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

            console.log(body);
            res.send(toHuobi);
        });

    },

    deleteOrder: function (req, res, next) {

        let nonce = moment().toISOString().substring(0, 19);

        console.log(req);
        let orderId = req.query.orderId;

        const signature = genSignature('POST', 'api.huobi.pro', `/v1/order/orders/${orderId}/submitcancel`, {
            Signature: req.query.Signature,
            SignatureMethod: 'HmacSHA256',
            SignatureVersion: '2',
            AccessKeyId: process.env.HUOBI_API_KEY,
        }, encodeURIComponent(nonce));


        console.log(signature);

        let form = {
            AccessKeyId: process.env.HUOBI_API_KEY,
            Signature: signature,
            SignatureMethod: 'HmacSHA256',
            Timestamp: nonce,
            SignatureVersion: '2',
        };

        var options = {
            method: 'POST',
            url: `https://api.huobi.pro/v1/order/orders/${orderId}/submitcancel`,
            form: form,
            json: true
        };
        request(options, function (error, response, body) {
            if (error) throw new Error(error);

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
                "orderId": toString(body.data),
                "clientOrderId": null
            });
        });

    },

    account: function (req, res, next) {

        let nonce = moment().toISOString().substring(0, 19);


        const signature = genSignature('GET', 'api.huobi.pro', `/v1/account/accounts/${process.env.HUOBI_ACC}/balance`, {
            Signature: req.query.Signature,
            SignatureMethod: 'HmacSHA256',
            SignatureVersion: '2',
            AccessKeyId: process.env.HUOBI_API_KEY,
        }, encodeURIComponent(nonce));

        console.log(signature);

        let form = {
            AccessKeyId: process.env.HUOBI_API_KEY,
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

        var options = {
            method: 'GET',
            url: `https://api.huobi.pro/v1/account/accounts/${process.env.HUOBI_ACC}/balance`,
            qs: form,
            json: true
        };

        console.log(options);

        request(options, function (error, response, body) {
            if (error) throw new Error(error);

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
                        temp["locked"] = body.data.list[i].balance;
                        accHb.balances.push(temp);
                        temp = {};
                    } else {
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