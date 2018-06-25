var request = require("request");
var CryptoJS = require("crypto-js");
var getval = require("./getval");

var symbol = require("./symbol");
var ExchangeError = require("./exchangeerror");

async function getvalue(req) {
    let secret = await getval.get(req.session.address + ":" + req.query.exchange + ":SECRET_KEY");
    if (secret === null) {
        return {err: new ExchangeError('Required Secret_key.', 7000)};
    }

    let api_key = await getval.get(req.session.address + ":" + req.query.exchange + ":API_KEY");
    if (api_key === null) {
        return {err: new ExchangeError('Required API_KEY.', 7001)};
    }

    return {
        api_key: api_key,
        secret_key: secret_key
    }
}


function genSignature(form, path, nonce, secret_key) {
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
    return CryptoJS.HmacSHA256(signatureStr, secret_key).toString(CryptoJS.enc.Hex);
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
        console.log(options);

        request(options, function (error, response, body) {
            if (error) {
                //todo handle this error
                return next(error);
            }

            console.log(body);

            if (body.success === false) {
                if (body.msg.substring(0, 16) === 'SYMBOL NOT FOUND') {
                    return next(new ExchangeError('Invalid symbol.', 1121));
                } else {
                    return next(new ExchangeError('An unknown error occured while processing the request.', 1000));
                }
            }

            for (let i in body.data.BUY) {
                body.data.BUY[i] = toString(body.data.BUY[i]);
                if (body.data.BUY.hasOwnProperty(i)) {
                    depthKc.bids.push([
                        body.data.BUY[i][0],
                        body.data.BUY[i][1]
                    ]);
                }
            }

            for (let i in body.data.SELL) {
                body.data.SELL[i] = toString(body.data.SELL[i]);
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

    newOrder: async function (req, res, next) {

        let nonce = new Date().getTime();

        const key = await getvalue(req);

        if (key.hasOwnProperty('err')) {
            return next(key.err);
        }

        try {
            var symbolName = symbol.carboneum[req.body.symbol].kucoin;
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

        var options = {
            method: 'POST',
            url: 'https://api.kucoin.com/v1/order',
            // qs: {
            //     symbol: symbolName
            // },
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

            console.log(body);
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

        let nonce = new Date().getTime();

        const key = await getvalue(req);

        if (key.hasOwnProperty('err')) {
            return next(key.err);
        }

        try {
            var symbolName = symbol.carboneum[req.query.symbol].kucoin;
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

        var options = {
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

            for (let i in body.data.SELL) {
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

            for (let i in body.data.BUY) {
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

            console.log(body);
            res.send(toKucoin);
        });

    },

    deleteOrder: async function (req, res, next) {

        let nonce = new Date().getTime();

        const key = await getvalue(req);

        if (key.hasOwnProperty('err')) {
            return next(key.err);
        }


        try {
            var symbolName = symbol.carboneum[req.query.symbol].kucoin;
        } catch (e) {
            symbolName = req.query.symbol;
        }

        const signature = genSignature({
            symbol: symbolName,
            type: 'BUY',
            orderOid: req.query.orderId,
        }, '/v1/order/detail', nonce, key.secret_key);

        var options = {
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


            try {
                var symbolName = symbol.carboneum[req.query.symbol].kucoin;
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

            var options = {
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
                console.log(body);
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

        var options = {
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
        console.log(options);

        request(options, function (error, response, body) {
            if (error) {
                //todo handle this error
                return next(error);
            }

            console.log(body);

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
                        "free": toString(body.data.datas[i].balance),
                        "locked": toString(body.data.datas[i].freezeBalance)
                    });
                }
            }

            console.log(body);
            res.send(accKc);
        });

    }

};

module.exports = obj;