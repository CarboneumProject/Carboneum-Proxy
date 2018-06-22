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


function genSignature(form, secret_key) {
    let queryString = [];
    if (form !== undefined) {
        for (let key in form) {
            if (key !== 'timestamp' && key !== 'signature') {
                queryString.push(key + '=' + form[key]);
                console.log(key);
                console.log(form[key]);
            }
        }
    }

    queryString.push('timestamp=' + form.timestamp);
    queryString = queryString.join('&');

    console.log(queryString);
    let signatureResult = CryptoJS.HmacSHA256(queryString, secret_key).toString(CryptoJS.enc.Hex);
    form.signature = signatureResult;
}

function deleteField(form) {
    let optionals = ['newClientOrderId', 'stopPrice', 'icebergQty', 'newOrderRespType']
    for (let i = 0; i < optionals.length; i++) {
        if (form[optionals[i]] === undefined) {
            delete form[optionals[i]];
        }
    }
}

let obj = {
    depth: function (req, res, next) {

        let nonce = new Date().getTime();

        try {
            var symbolName = symbol.carboneum[req.query.symbol].binance;
        } catch (e) {
            symbolName = req.query.symbol;
        }

        var options = {
            method: 'GET',
            url: 'https://api.binance.com/api/v1/depth',
            qs: {
                symbol: symbolName
            },
            headers:
                {
                    'Postman-Token': 'cabcef67-a56f-4f80-b2cf-bd0a9001d03d',
                    'Cache-Control': 'no-cache'
                },
            json: true
        };

        request(options, function (error, response, body) {
            if (error) {
                //todo handle this error
                return next(error);
            }

            obj = body;
            obj.lastUpdateId = nonce;

            if (response.statusCode !== 200) {
                if (body.code === -1100) {
                    return next(new ExchangeError('Illegal characters found in a parameter.', 1100));
                } else if (body.code === -1112) {
                    return next(new ExchangeError('No orders on book for symbol.', 1112));
                } else if (body.code === -2014) {
                    return next(new ExchangeError('Invalid symbol.', 1121));
                } else if (body.code === -2008) {
                    return next(new ExchangeError('Invalid Api-Key ID.', 2008));
                } else if (body.code === -2014) {
                    return next(new ExchangeError('API-key format invalid.', 2014));
                } else {
                    return next(new ExchangeError('An unknown error occured while processing the request.', 1000));
                }
            }
            res.send(obj);
        });

    },

    newOrder: async function (req, res, next) {

        const key = await getvalue(req);

        if (key.hasOwnProperty('err')) {
            return next(key.err);
        }

        try {
            var symbolName = symbol.carboneum[req.body.symbol].binance;
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

        var options = {
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
                "orderId": body.orderId.toString(),
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

        try {
            var symbolName = symbol.carboneum[req.query.symbol].binance;
        } catch (e) {
            symbolName = req.query.symbol;
        }

        let arrBinance = [];

        let qs = {
            symbol: symbolName,
            timestamp: req.query.timestamp + '000'
        };

        genSignature(qs, key.secret_key);
        var options = {
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

            console.log(body);
            for (let i in body) {
                body[i].symbol = symbol.binance[body[i].symbol];
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

            console.log(body);
            res.send(arrBinance);
        });

    },
    deleteOrder: async function (req, res, next) {
        try {
            var symbolName = symbol.carboneum[req.query.symbol].binance;
        } catch (e) {
            symbolName = req.query.symbol;
        }

        let qs = {
            symbol: symbolName,
            orderId: req.query.orderId,
            timestamp: req.query.timestamp + '000'
        };

        genSignature(qs, key.secret_key);
        var options = {
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
        console.log(options);
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

            console.log(body);
            res.send({
                "symbol": body.symbol,
                "origClientOrderId": body.origClientOrderId,
                "orderId": toString(body.orderId),
                "clientOrderId": body.clientOrderId
            });
        });

    },

    account: async function (req, res, next) {
        let qs = {
            timestamp: req.query.timestamp + '000'
        };

        genSignature(qs, key.secret_key);
        var options = {
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

            console.log(body);
            res.send(body);
        });

    }

};

module.exports = obj;