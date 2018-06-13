const request = require('supertest');
const app = require('../app');

const binance = require('./binance');

test('binance depth', function (done) {
  request(app)
    .get('/depth/')
    .query({ exchange: 'binance', symbol: 'ETH/BTC', timestamp: Math.round(new Date().getTime() / 1000) })
    .set('Accept', 'application/json')
    .then(response => {
      const depth = response.body;
      expect(depth).toHaveProperty('bids');
      expect(depth).toHaveProperty('asks');
      expect(Array.isArray(depth['bids'])).toBe(true);
      expect(Array.isArray(depth['asks'])).toBe(true);
      expect(depth['asks'].length).toBeGreaterThan(0);
      expect(depth['bids'].length).toBeGreaterThan(0);

      for (let i = 0; i < depth['asks'].length; i++) {
        for (let j = 0; j < 2; j++) {
          expect(typeof depth['bids'][i][j]).toBe('string');
          expect(typeof depth['bids'][i][j]).toBe('string');
          expect(typeof depth['asks'][i][j]).toBe('string');
          expect(typeof depth['asks'][i][j]).toBe('string');
          expect(typeof parseFloat(depth['bids'][i][j])).toBe('number');
          expect(typeof parseFloat(depth['bids'][i][j])).toBe('number');
          expect(typeof parseFloat(depth['asks'][i][j])).toBe('number');
          expect(typeof parseFloat(depth['asks'][i][j])).toBe('number');
        }
      }
      done();
    });
});

test('binance account', function (done) {
  request(app)
    .get('/account/')
    .query({ exchange: 'binance', timestamp: Math.round(new Date().getTime() / 1000) })
    .set('Accept', 'application/json')
    .then(response => {
      expect(response.statusCode).toBe(200);
      expect(response.body).toHaveProperty('makerCommission');
      expect(typeof response.body.makerCommission).toBe('number');
      expect(response.body).toHaveProperty('takerCommission');
      expect(typeof response.body.takerCommission).toBe('number');
      expect(response.body).toHaveProperty('buyerCommission');
      expect(typeof response.body.buyerCommission).toBe('number');
      expect(response.body).toHaveProperty('sellerCommission');
      expect(typeof response.body.sellerCommission).toBe('number');
      expect(response.body).toHaveProperty('canTrade');
      expect(typeof response.body.canTrade).toBe('boolean');
      expect(response.body).toHaveProperty('canWithdraw');
      expect(typeof response.body.canWithdraw).toBe('boolean');
      expect(response.body).toHaveProperty('canDeposit');
      expect(typeof response.body.canDeposit).toBe('boolean');
      expect(response.body).toHaveProperty('updateTime');
      expect(typeof response.body.updateTime).toBe('number');
      expect(response.body).toHaveProperty('balances');
      expect(Array.isArray(response.body.balances)).toBe(true);
      const balances = response.body.balances;
      for (let i = 0; i < balances.length; i++) {
        expect(balances[i]).toHaveProperty('asset');
        expect(typeof balances[i].asset).toBe('string');
        expect(balances[i]).toHaveProperty('free');
        expect(typeof balances[i].free).toBe('string');
        expect(typeof parseFloat(balances[i].free)).toBe('number');
        expect(balances[i]).toHaveProperty('locked');
        expect(typeof balances[i].locked).toBe('string');
        // noinspection JSCheckFunctionSignatures
        expect(typeof parseFloat(balances[i].locked)).toBe('number');
      }
      done();
    })
});

test('binance allOrders', function (done) {
  const symbol = 'ETH/BTC';

  request(app)
    .get('/allOrders/')
    .query({ exchange: 'binance', symbol: symbol, timestamp: Math.round(new Date().getTime() / 1000) })
    .set('Accept', 'application/json')
    .then(response => {
      expect(response.statusCode).toBe(200);
      expect(Array.isArray(response.body)).toBe(true);
      const allOrders = response.body;

      for (let i = 0; i < allOrders.length; i++) {
        expect(allOrders[i]).toHaveProperty('symbol');
        expect(typeof allOrders[i].symbol).toBe('string');
        // noinspection SpellCheckingInspection
        expect(allOrders[i].symbol).toBe(symbol);

        expect(allOrders[i]).toHaveProperty('orderId');
        expect(typeof allOrders[i].orderId).toBe('number');

        expect(allOrders[i]).toHaveProperty('clientOrderId');
        expect(typeof allOrders[i].clientOrderId).toBe('string');

        expect(allOrders[i]).toHaveProperty('price');
        expect(typeof allOrders[i].price).toBe('string');
        expect(typeof parseFloat(allOrders[i].price)).toBe('number');

        expect(allOrders[i]).toHaveProperty('origQty');
        expect(typeof allOrders[i].origQty).toBe('string');
        expect(typeof parseFloat(allOrders[i].origQty)).toBe('number');

        expect(allOrders[i]).toHaveProperty('executedQty');
        expect(typeof allOrders[i].executedQty).toBe('string');
        expect(typeof parseFloat(allOrders[i].executedQty)).toBe('number');

        expect(allOrders[i]).toHaveProperty('status');
        expect(typeof allOrders[i].status).toBe('string');

        expect(allOrders[i]).toHaveProperty('timeInForce');
        expect(typeof allOrders[i].timeInForce).toBe('string');

        expect(allOrders[i]).toHaveProperty('type');
        expect(typeof allOrders[i].type).toBe('string');

        expect(allOrders[i]).toHaveProperty('side');
        expect(typeof allOrders[i].side).toBe('string');

        expect(allOrders[i]).toHaveProperty('stopPrice');
        expect(typeof allOrders[i].stopPrice).toBe('string');
        expect(typeof parseFloat(allOrders[i].stopPrice)).toBe('number');

        expect(allOrders[i]).toHaveProperty('icebergQty');
        expect(typeof allOrders[i].icebergQty).toBe('string');
        expect(typeof parseFloat(allOrders[i].icebergQty)).toBe('number');

        expect(allOrders[i]).toHaveProperty('time');
        expect(typeof allOrders[i].time).toBe('number');

        expect(allOrders[i]).toHaveProperty('isWorking');
        expect(typeof allOrders[i].isWorking).toBe('boolean');
      }
      done();
    })
});


test('binance create and cancel order', async function (done) {
  const symbol = 'ETH/BTC';
  const price = '0.9';
  const quantity = '0.002';
  const timeInForce = 'GTC';
  const side = 'SELL';
  const type = 'LIMIT';

  const sellResponse = await request(app)
    .post('/order/')
    .query({ exchange: 'binance' })
    .send({
      side: side,
      type: type,
      timeInForce: timeInForce,
      quantity: quantity,
      price: '0.9',
      recvWindow: '5000',
      symbol: symbol,
      timestamp: Math.round(new Date().getTime() / 1000),
    })
    .set('Accept', 'application/json');

  expect(sellResponse.body).toHaveProperty('symbol');
  expect(typeof sellResponse.body.symbol).toBe('string');
  expect(sellResponse.body.symbol).toBe(symbol);

  expect(sellResponse.body).toHaveProperty('clientOrderId');
  expect(typeof sellResponse.body.clientOrderId).toBe('string');

  expect(sellResponse.body).toHaveProperty('price');
  expect(typeof sellResponse.body.price).toBe('string');
  expect(typeof parseFloat(sellResponse.body.price)).toBe('number');
  expect(parseFloat(sellResponse.body.price)).toBe(parseFloat(price));

  expect(sellResponse.body).toHaveProperty('origQty');
  expect(typeof sellResponse.body.origQty).toBe('string');
  expect(typeof parseFloat(sellResponse.body.origQty)).toBe('number');
  expect(parseFloat(sellResponse.body.origQty)).toBe(parseFloat(quantity));

  expect(sellResponse.body).toHaveProperty('executedQty');
  expect(typeof sellResponse.body.executedQty).toBe('string');
  expect(typeof parseFloat(sellResponse.body.executedQty)).toBe('number');

  expect(sellResponse.body).toHaveProperty('status');
  expect(typeof sellResponse.body.status).toBe('string');
  expect(sellResponse.body.status).toBe('NEW');

  expect(sellResponse.body).toHaveProperty('timeInForce');
  expect(typeof sellResponse.body.timeInForce).toBe('string');
  expect(sellResponse.body.timeInForce).toBe(timeInForce);

  expect(sellResponse.body).toHaveProperty('type');
  expect(typeof sellResponse.body.type).toBe('string');
  expect(sellResponse.body.type).toBe(type);

  expect(sellResponse.body).toHaveProperty('side');
  expect(typeof sellResponse.body.side).toBe('string');
  expect(sellResponse.body.side).toBe(side);

  expect(sellResponse.body).toHaveProperty('orderId');
  expect(typeof sellResponse.body.orderId).toBe('number');

  expect(sellResponse.body).toHaveProperty('transactTime');
  expect(typeof sellResponse.body.transactTime).toBe('number');

  const orderId = sellResponse.body.orderId.toString();

  const cancelResponse = await request(app)
    .delete('/order/')
    .query({
      exchange: 'binance',
      symbol: symbol,
      orderId: orderId,
      timestamp: Math.round(new Date().getTime() / 1000)
    })
    .set('Accept', 'application/json');

  expect(cancelResponse.body).toHaveProperty('symbol');
  expect(typeof cancelResponse.body.symbol).toBe('string');
  expect(cancelResponse.body.symbol).toBe(symbol);

  expect(cancelResponse.body).toHaveProperty('origClientOrderId');
  expect(typeof cancelResponse.body.origClientOrderId).toBe('string');

  expect(cancelResponse.body).toHaveProperty('clientOrderId');
  expect(typeof cancelResponse.body.clientOrderId).toBe('string');

  expect(cancelResponse.body).toHaveProperty('orderId');
  expect(typeof cancelResponse.body.orderId).toBe('number');

  done();
});