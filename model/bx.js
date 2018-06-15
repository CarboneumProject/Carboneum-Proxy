var request = require("request");
var CryptoJS = require("crypto-js");

var symbol = require("./symbol");
var ExchangeError = require("./exchangeerror");

function genSignature(form) {
    let queryString = [];

    queryString.push(form.key + form.nonce);
    queryString = queryString.join('');

    console.log(queryString);
    let signatureResult = CryptoJS.SHA256(queryString + process.env.BX_SECRET_KEY).toString(CryptoJS.enc.Hex);
    form.signature = signatureResult;
}

let obj = {
    depth: function (req, res) {

        let nonce = new Date().getTime();
        var options = {
            method: 'GET',
            url: 'https://bx.in.th/api/orderbook/',
            qs: {
                pairing: symbol.carboneum[req.query.symbol].bx
            },
            headers:
                {
                    'Cache-Control': 'no-cache'
                },
            json:true
        };
        request(options, function (error, response, body) {
            if (error) throw new Error(error);

            body.lastUpdateId = nonce;

            console.log(body);
            res.send(body);
        });

    },

    newOrder: function (req, res, next) {
        let form = {
            key: process.env.BX_API_KEY,
            nonce: req.body.timestamp + '000',
            signature: '',
            pairing: symbol.carboneum[req.query.symbol].bx,
            type: req.body.side,
            amount: req.body.quantity,
            rate: req.body.price
        };

        genSignature(form);
        console.log(form);
        var options = {
            method: 'POST',
            url: 'https://bx.in.th/api/order',
            headers:
                {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
            form: form,
            json:true
        };

        request(options, function (error, response, body) {
            if (error) throw new Error(error);


            console.log(body);
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
                }  else {
                    return next(new ExchangeError('An unknown error occured while processing the request.', 1000));
                }
            }

            res.send({
                "symbol": req.query.symbol,
                "orderId": body.order_id,
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
        let form = {
            key: process.env.BX_API_KEY,
            nonce: req.query.timestamp + '000',
            pairing: symbol.carboneum[req.query.symbol].bx
        };

        let toBinance = [];

        genSignature(form);
        var options = {
            method: 'POST',
            url: 'https://bx.in.th/api/getorders/',
            headers:
                {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
            form: form,
            json:true
        };
        request(options, function (error, response, body) {
            if (error) throw new Error(error);

            console.log(body);
            if (body.success === false) {
                if (body.error.substring(0, 28) === 'You did not set any API key.') {
                    return next(new ExchangeError('Invalid Api-Key ID.', 2008));
                } else if (body.error.substring(0, 13) === 'Invalid Nonce') {
                    return next(new ExchangeError('Invalid Nonce.', 9004));
                } else {
                    return next(new ExchangeError('An unknown error occured while processing the request.', 1000));
                }
            }

            for (let i in body.orders) {
                toBinance.push({
                    "symbol": req.query.symbol,
                    "orderId": body.orders[i].order_id,
                    "clientOrderId": '',
                    "price": body.orders[i].rate,
                    "origQty": body.orders[i].amount,
                    "executedQty": '',
                    "status": '',
                    "timeInForce": '',
                    "type": '',
                    "side": body.orders[i].order_type.toUpperCase(),
                    "stopPrice": '',
                    "icebergQty": '',
                    "time": Date.parse(body.orders[i].date)/1000,
                    "isWorking": ''
                });
            }
            console.log(toBinance);
            res.send(toBinance);
        });

    },
    deleteOrder: function (req, res, next) {
        let form = {
            key: process.env.BX_API_KEY,
            nonce: req.query.timestamp + '000',
            pairing: symbol.carboneum[req.query.symbol].bx,
            order_id: req.body.orderId
        };

        genSignature(form);
        var options = {
            method: 'POST',
            url: 'https://bx.in.th/api/cancel/',
            headers:
                {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
            form: form,
            json:true
        };
        request(options, function (error, response, body) {
            if (error) throw new Error(error);

            console.log(body);

            if(body.error !== null) {
                if (body.error.substring(0, 32) === 'Order not found') {
                    return next(new ExchangeError('Unknown order sent.', 2011));
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
        let form = {
            key: process.env.BX_API_KEY,
            nonce: req.query.timestamp + '000'
        };

        let accBx = {
            "makerCommission": '',
            "takerCommission": '',
            "buyerCommission": '',
            "sellerCommission": '',
            "canTrade": '',
            "canWithdraw": '',
            "canDeposit": '',
            "updateTime": req.query.timestamp,
            "balances": []

    };

        genSignature(form);
        var options = {
            method: 'POST',
            url: 'https://bx.in.th/api/balance/',
            headers:
                {
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
            form: form,
            json:true
        };
        request(options, function (error, response, body) {
            if (error) throw new Error(error);

            console.log(body);

            if(body.error === false) {
                if (body.error.substring(0, 15) === 'Order not found') {
                    return next(new ExchangeError('Mandatory parameter was not sent, was empty/null, or malformed.', 1102));
                } else {
                    return next(new ExchangeError('An unknown error occured while processing the request.', 1000));
                }
            }

            for (let i in body.balance) {
                if (body.balance.hasOwnProperty(i)) {
                    accBx.balances.push({
                        "asset": i,
                        "free": body.balance[i].available,
                        "locked": body.balance[i].orders
                    });
                }
            }

            console.log(accBx);
            res.send(accBx);
        });

    }

};

module.exports = obj;