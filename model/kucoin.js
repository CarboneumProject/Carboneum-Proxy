var request = require("request");
var CryptoJS = require("crypto-js");

var symbol = require("./symbol");
var ExchangeError = require("./exchangeerror");


function genSignature(form, path, nonce) {
    let queryString = [];
    if (form !== undefined) {
        for (let key in form) {
            if (key !== 'timestamp' && key !== 'signature') {
                queryString.push(key + '=' + form[key]);
                console.log(key);
                console.log(form[key]);
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
    return CryptoJS.HmacSHA256(signatureStr, process.env.KU_SECRET_KEY).toString(CryptoJS.enc.Hex);
}

let obj = {
    depth: function (req, res, next) {

        let nonce = new Date().getTime();

        try {
            var symbolName = symbol.carboneum[req.query.symbol].kucoin;
        } catch (e) {
            symbolName = req.query.symbol;
        }

        let depthKc = {
            "lastUpdateId": nonce,
            "bids": [],
            "asks": []
        };

        var options = {
            method: 'GET',
            url: 'https://api.kucoin.com/v1/open/orders',
            qs: {
                symbol: symbolName
            },
            json: true
        };

        request(options, function (error, response, body) {
            if (error) throw new Error(error);

            if (body.success === false) {
                if (body.msg.substring(0, 16) === 'SYMBOL NOT FOUND') {
                    return next(new ExchangeError('Invalid symbol.', 1121));
                } else {
                    return next(new ExchangeError('An unknown error occured while processing the request.', 1000));
                }
            }

            for (let i in body.data.BUY) {
                if (body.data.BUY.hasOwnProperty(i)) {
                    depthKc.bids.push([
                        body.data.BUY[i][0],
                        body.data.BUY[i][1]
                    ]);
                }
            }

            for (let i in body.data.SELL) {
                if (body.data.SELL.hasOwnProperty(i)) {
                    depthKc.asks.push([
                        body.data.SELL[i][0],
                        body.data.SELL[i][1]
                    ]);
                }
            }
            console.log(body);
            res.send(depthKc);
        });

    },

    newOrder: function (req, res, next) {
        let form = {
            type: req.body.side.toUpperCase(),
            price: req.body.price,
            amount: req.body.quantity
        };

        let nonce = new Date().getTime();

        try {
            var symbolName = symbol.carboneum[req.query.symbol].kucoin;
        } catch (e) {
            symbolName = req.query.symbol;
        }

        const signature = genSignature({
            symbol: symbolName,
            type: req.body.side.toUpperCase(),
            price: req.body.price,
            amount: req.body.quantity
        }, '/v1/order', nonce);

        var options = {
            method: 'POST',
            url: 'https://api.kucoin.com/v1/order',
            qs: {
                symbol: symbolName
            },
            headers:
                {
                    'Cache-Control': 'no-cache',
                    'KC-API-SIGNATURE': signature,
                    'KC-API-NONCE': nonce,
                    'KC-API-KEY': process.env.KC_API_KEY
                },
            form: form,
            json: true
        };
        request(options, function (error, response, body) {
            if (error) throw new Error(error);

            // body.symbol = symbol.kucoin[body.symbol];

            if (body.success === false) {
                if (body.msg.substring(0, 29) === 'Signature verification failed') {
                    return next(new ExchangeError('Invalid Signature.', 1022));
                } else if (body.msg.substring(0, 17) === 'Invalid operation') {
                    return next(new ExchangeError('This operation is not supported.', 1020));
                } else {
                    return next(new ExchangeError('An unknown error occured while processing the request.', 1000));
                }
            }

            console.log(body);
            res.send({
                "symbol": req.query.symbol,
                "orderId": body.data.orderOid,
                "clientOrderId": '',
                "transactTime": req.body.timestamp,
                "price": req.body.price,
                "origQty": req.body.quantity,
                "executeQty": '',
                "status": '',
                "timeInForce": '',
                "type": '',
                "side": req.body.side.toUpperCase()
            });
        });

    },

    allOrder: function (req, res, next) {

        let nonce = new Date().getTime();

        try {
            var symbolName = symbol.carboneum[req.query.symbol].kucoin;
        } catch (e) {
            symbolName = req.query.symbol;
        }

        const signature = genSignature({
            symbol: symbolName
        }, '/v1/order/active', nonce);

        let toKucoin = [];

        let qs = {
            symbol: symbolName
        };

        var options = {
            method: 'GET',
            url: 'https://api.kucoin.com/v1/order/active',
            headers:
                {
                    'Cache-Control': 'no-cache',
                    'KC-API-SIGNATURE': signature,
                    'KC-API-NONCE': nonce,
                    'KC-API-KEY': process.env.KC_API_KEY
                },
            qs: qs,
            json: true
        };
        request(options, function (error, response, body) {
            if (error) throw new Error(error);

            if (body.success === false) {
                if (body.msg.substring(0, 29) === 'Signature verification failed') {
                    return next(new ExchangeError('Invalid Signature.', 1022));
                } else if (body.msg.substring(0, 17) === 'Invalid operation') {
                    return next(new ExchangeError('This operation is not supported.', 1020));
                } else {
                    return next(new ExchangeError('An unknown error occured while processing the request.', 1000));
                }
            }

            for (let i in body.data.SELL) {
                toKucoin.push({
                    "symbol": req.query.symbol,
                    "orderId": body.data.SELL[i][5],
                    "clientOrderId": '',
                    "price": body.data.SELL[i][2],
                    "origQty": body.data.SELL[i][3],
                    "executedQty": '',
                    "status": '',
                    "timeInForce": '',
                    "type": '',
                    "side": body.data.SELL[i][1],
                    "stopPrice": '',
                    "icebergQty": '',
                    "time": body.data.SELL[i][0],
                    "isWorking": ''
                });
            }

            for (let i in body.data.BUY) {
                toKucoin.push({
                    "symbol": req.query.symbol,
                    "orderId": body.data.BUY[i][5],
                    "clientOrderId": '',
                    "price": body.data.BUY[i][2],
                    "origQty": body.data.BUY[i][3],
                    "executedQty": '',
                    "status": '',
                    "timeInForce": '',
                    "type": '',
                    "side": body.data.BUY[i][1],
                    "stopPrice": '',
                    "icebergQty": '',
                    "time": body.data.BUY[i][0],
                    "isWorking": ''
                });
            }

            console.log(body);
            res.send(toKucoin);
        });

    },

    deleteOrder: function (req, res, next) {

        let nonce = new Date().getTime();

        try {
            var symbolName = symbol.carboneum[req.query.symbol].kucoin;
        } catch (e) {
            symbolName = req.query.symbol;
        }

        let form = {
            symbol: symbolName,
            orderOid: req.body.orderId,
            type: req.body.side.toUpperCase()
        };


        const signature = genSignature({
            symbol: symbolName,
            orderOid: req.body.orderId,
            type: req.body.side.toUpperCase()
        }, '/v1/cancel-order', nonce);

        var options = {
            method: 'POST',
            url: 'https://api.kucoin.com/v1/cancel-order',
            headers:
                {
                    'Cache-Control': 'no-cache',
                    'KC-API-SIGNATURE': signature,
                    'KC-API-NONCE': nonce,
                    'KC-API-KEY': process.env.KC_API_KEY
                },
            form: form,
            json: true
        };
        request(options, function (error, response, body) {
            if (error) throw new Error(error);
            // console.log(res);
            // body.symbol = symbol.binance[body.symbol];

            if (body.success === false) {
                if (body.msg.substring(0, 29) === 'Signature verification failed') {
                    return next(new ExchangeError('Invalid Signature.', 1022));
                } else if (body.msg.substring(0, 17) === 'Invalid operation') {
                    return next(new ExchangeError('This operation is not supported.', 1020));
                } else {
                    return next(new ExchangeError('An unknown error occured while processing the request.', 1000));
                }
            }
            console.log(body);
            res.send({
                "symbol": req.query.symbol,
                "origClientOrderId": '',
                "orderId": req.body.orderId,
                "clientOrderId": ''
            });
        });

    },

    account: function (req, res, next) {

        let nonce = new Date().getTime();

        const signature = genSignature({}, '/v1/account/balances', nonce);

        let accKc = {
            "makerCommission": '',
            "takerCommission": '',
            "buyerCommission": '',
            "sellerCommission": '',
            "canTrade": '',
            "canWithdraw": '',
            "canDeposit": '',
            "updateTime": nonce,
            "balances": []
        };

        var options = {
            method: 'GET',
            url: 'https://api.kucoin.com/v1/account/balances',
            headers:
                {
                    'Cache-Control': 'no-cache',
                    'KC-API-SIGNATURE': signature,
                    'KC-API-NONCE': nonce,
                    'KC-API-KEY': process.env.KC_API_KEY
                },
            json: true
        };
        request(options, function (error, response, body) {
            if (error) throw new Error(error);

            if (body.success === false) {
                if (body.msg.substring(0, 29) === 'Signature verification failed') {
                    return next(new ExchangeError('Invalid Signature.', 1022));
                } else if (body.msg.substring(0, 17) === 'Invalid operation') {
                    return next(new ExchangeError('This operation is not supported.', 1020));
                } else {
                    return next(new ExchangeError('An unknown error occured while processing the request.', 1000));
                }
            }

            for (let i in body.data.datas) {
                if (body.data.datas.hasOwnProperty(i)) {
                    accKc.balances.push({
                        "asset": body.data.datas[i].coinType,
                        "free": body.data.datas[i].balance,
                        "locked": body.data.datas[i].freezeBalance
                    });
                }
            }

            console.log(body);
            res.send(accKc);
        });

    }

};

module.exports = obj;