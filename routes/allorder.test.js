const request = require('supertest');
const app = require('../app');
const redis = require('../model/redis');

afterAll(async (done) => {
  await redis.end(false);
  done();
});

let cookie;

beforeAll(async (done) => {
  const res = await request(app)
    .post('/sign-in/')
    .send({
      account: process.env.ACCOUNT,
      signed: process.env.SIGNED
    })
    .expect(200);

  cookie = res.headers['set-cookie'];

  await request(app)
    .post('/getval/')
    .query({exchange: 'binance'})
    .send({
      API_KEY: process.env.BN_API_KEY,
      SECRET_KEY: process.env.BN_SECRET_KEY
    })
    .set('cookie', cookie)
    .expect(200);  cookie = res.headers['set-cookie'];

  await request(app)
    .post('/getval/')
    .query({exchange: 'bx'})
    .send({
      API_KEY: process.env.BX_API_KEY,
      SECRET_KEY: process.env.BX_SECRET_KEY
    })
    .set('cookie', cookie);

  await request(app)
    .post('/getval/')
    .query({exchange: 'huobi'})
    .send({
      API_KEY: process.env.HUOBI_API_KEY,
      SECRET_KEY: process.env.HUOBI_SECRET_KEY
    })
    .set('cookie', cookie)
    .expect(200);

  await request(app)
    .post('/getval/')
    .query({exchange: 'kucoin'})
    .send({
      API_KEY: process.env.KC_API_KEY,
      SECRET_KEY: process.env.KC_SECRET_KEY
    })
    .set('cookie', cookie)
    .expect(200);
  done();
});

test('binance allOrders', async function (done) {
  const symbol = 'ETH/BTC';

  const res = await request(app)
    .get('/allOrders/')
    .query({exchange: 'binance', symbol: symbol, timestamp: Math.round(new Date().getTime() / 1000)})
    .set('Accept', 'application/json')
    .set('cookie', cookie)
    .expect(200);

  const allOrders = res.body;
  expect(Array.isArray(allOrders)).toBe(true);

  for (let i = 0; i < allOrders.length; i++) {
    expect(allOrders[i]).toHaveProperty('symbol');
    expect(typeof allOrders[i].symbol).toBe('string');
    // noinspection SpellCheckingInspection
    expect(allOrders[i].symbol).toBe(symbol);

    expect(allOrders[i]).toHaveProperty('orderId');
    expect(typeof allOrders[i].orderId).toBe('string');

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

});


test('bx allOrders', function (done) {
  const symbol = 'ETH/BTC';

  request(app)
    .get('/allOrders/')
    .query({exchange: 'bx', symbol: symbol, timestamp: Math.round(new Date().getTime() / 1000)})
    .set('Accept', 'application/json')
    .set('cookie', cookie)
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
        expect(typeof allOrders[i].orderId).toBe('string');

        expect(allOrders[i]).toHaveProperty('clientOrderId');
        expect(allOrders[i].clientOrderId).toBe(null);

        expect(allOrders[i]).toHaveProperty('price');
        expect(typeof allOrders[i].price).toBe('string');
        expect(typeof parseFloat(allOrders[i].price)).toBe('number');

        expect(allOrders[i]).toHaveProperty('origQty');
        expect(typeof allOrders[i].origQty).toBe('string');
        expect(typeof parseFloat(allOrders[i].origQty)).toBe('number');

        expect(allOrders[i]).toHaveProperty('executedQty');
        // expect(typeof allOrders[i].executedQty).toBe('string');
        expect(allOrders[i].executedQty).toBe(null);

        expect(allOrders[i]).toHaveProperty('status');
        expect(allOrders[i].status).toBe(null);

        expect(allOrders[i]).toHaveProperty('timeInForce');
        expect(allOrders[i].timeInForce).toBe(null);

        expect(allOrders[i]).toHaveProperty('type');
        expect(allOrders[i].type).toBe(null);

        expect(allOrders[i]).toHaveProperty('side');
        expect(typeof allOrders[i].side).toBe('string');

        expect(allOrders[i]).toHaveProperty('stopPrice');
        // expect(typeof allOrders[i].stopPrice).toBe('string');
        expect(allOrders[i].stopPrice).toBe(null);

        expect(allOrders[i]).toHaveProperty('icebergQty');
        // expect(typeof allOrders[i].icebergQty).toBe('string');
        expect(allOrders[i].icebergQty).toBe(null);

        expect(allOrders[i]).toHaveProperty('time');
        expect(typeof allOrders[i].time).toBe('number');

        expect(allOrders[i]).toHaveProperty('isWorking');
        expect(allOrders[i].isWorking).toBe(null);
      }
      done();
    })
});

test('huobi allOrders', function (done) {
  const symbol = 'ETH/BTC';

  request(app)
    .get('/allOrders/')
    .query({exchange: 'huobi', symbol: symbol, timestamp: Math.round(new Date().getTime() / 1000) + 3})
    .set('Accept', 'application/json')
    .set('cookie', cookie)
    .expect(200)
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
        expect(typeof allOrders[i].orderId).toBe('string');

        expect(allOrders[i]).toHaveProperty('clientOrderId');
        expect(allOrders[i].clientOrderId).toBe(null);

        expect(allOrders[i]).toHaveProperty('price');
        expect(typeof allOrders[i].price).toBe('string');
        expect(typeof parseFloat(allOrders[i].price)).toBe('number');

        expect(allOrders[i]).toHaveProperty('origQty');
        expect(typeof allOrders[i].origQty).toBe('string');
        expect(typeof parseFloat(allOrders[i].origQty)).toBe('number');

        expect(allOrders[i]).toHaveProperty('executedQty');
        expect(allOrders[i].executedQty).toBe(null);
        // expect(typeof parseFloat(allOrders[i].executedQty)).toBe('number');

        expect(allOrders[i]).toHaveProperty('status');
        expect(allOrders[i].status).toBe(null);

        expect(allOrders[i]).toHaveProperty('timeInForce');
        expect(allOrders[i].timeInForce).toBe(null);

        expect(allOrders[i]).toHaveProperty('type');
        expect(allOrders[i].type).toBe(null);

        expect(allOrders[i]).toHaveProperty('side');
        expect(typeof allOrders[i].side).toBe('string');

        expect(allOrders[i]).toHaveProperty('stopPrice');
        expect(allOrders[i].stopPrice).toBe(null);
        // expect(typeof parseFloat(allOrders[i].stopPrice)).toBe('number');

        expect(allOrders[i]).toHaveProperty('icebergQty');
        expect(allOrders[i].icebergQty).toBe(null);
        // expect(typeof parseFloat(allOrders[i].icebergQty)).toBe('number');

        expect(allOrders[i]).toHaveProperty('time');
        expect(typeof allOrders[i].time).toBe('number');

        expect(allOrders[i]).toHaveProperty('isWorking');
        expect(allOrders[i].isWorking).toBe(null);
      }
      done();
    })
});

test('kucoin allOrders', function (done) {
  const symbol = 'ETH/BTC';

  request(app)
    .get('/allOrders/')
    .query({exchange: 'kucoin', symbol: symbol, timestamp: Math.round(new Date().getTime() / 1000)})
    .set('Accept', 'application/json')
    .set('cookie', cookie)
    .expect(200)
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
        expect(typeof allOrders[i].orderId).toBe('string');

        expect(allOrders[i]).toHaveProperty('clientOrderId');
        expect(allOrders[i].clientOrderId).toBe(null);

        expect(allOrders[i]).toHaveProperty('price');
        expect(typeof allOrders[i].price).toBe('string');
        expect(typeof parseFloat(allOrders[i].price)).toBe('number');

        expect(allOrders[i]).toHaveProperty('origQty');
        expect(typeof allOrders[i].origQty).toBe('string');
        expect(typeof parseFloat(allOrders[i].origQty)).toBe('number');

        expect(allOrders[i]).toHaveProperty('executedQty');
        expect(allOrders[i].executedQty).toBe(null);

        expect(allOrders[i]).toHaveProperty('status');
        expect(allOrders[i].status).toBe(null);

        expect(allOrders[i]).toHaveProperty('timeInForce');
        expect(allOrders[i].timeInForce).toBe(null);

        expect(allOrders[i]).toHaveProperty('type');
        expect(allOrders[i].type).toBe(null);

        expect(allOrders[i]).toHaveProperty('side');
        expect(typeof allOrders[i].side).toBe('string');

        expect(allOrders[i]).toHaveProperty('stopPrice');
        expect(allOrders[i].stopPrice).toBe(null);

        expect(allOrders[i]).toHaveProperty('icebergQty');
        expect(allOrders[i].icebergQty).toBe(null);

        expect(allOrders[i]).toHaveProperty('time');
        expect(typeof allOrders[i].time).toBe('number');

        expect(allOrders[i]).toHaveProperty('isWorking');
        expect(allOrders[i].isWorking).toBe(null);
      }
      done();
    })
});
