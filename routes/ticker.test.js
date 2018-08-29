const request = require('supertest');
const app = require('../app');
const redis = require('../model/redis');

afterAll(async (done) => {
  await redis.end(false);
  done();
});

test('/ticker/compare ETH/BTC', async (done) => {
  const response = await request(app)
    .get('/ticker/compare')
    .query({symbol: 'ETH/BTC'})
    .send();

  expect(response.statusCode).toBe(200);
  expect(Array.isArray(response.body)).toBe(true);

  const exchanges = response.body;

  expect(exchanges.length).toBe(4);

  for (let i = 0; i < exchanges.length; i++) {
    expect(exchanges[i]).toHaveProperty('exchange');
    expect(typeof exchanges[i].exchange).toBe('string');
    expect(exchanges[i]).toHaveProperty('price');
    expect(typeof exchanges[i].price).toBe('string');
    expect(typeof parseFloat(exchanges[i].price)).toBe('number');
    expect(exchanges[i]).toHaveProperty('change');
    expect(typeof exchanges[i].change).toBe('string');
    expect(typeof parseFloat(exchanges[i].change)).toBe('number');
  }

  done();
});

test('/ticker/compare BTC/USDT', async (done) => {
  const response = await request(app)
    .get('/ticker/compare')
    .query({symbol: 'BTC/USDT'})
    .send();

  expect(response.statusCode).toBe(200);
  expect(Array.isArray(response.body)).toBe(true);

  const exchanges = response.body;

  expect(exchanges.length).toBe(3);

  for (let i = 0; i < exchanges.length; i++) {
    expect(exchanges[i]).toHaveProperty('exchange');
    expect(typeof exchanges[i].exchange).toBe('string');
    expect(exchanges[i]).toHaveProperty('price');
    expect(typeof exchanges[i].price).toBe('string');
    expect(typeof parseFloat(exchanges[i].price)).toBe('number');
    expect(exchanges[i]).toHaveProperty('change');
    expect(typeof exchanges[i].change).toBe('string');
    expect(typeof parseFloat(exchanges[i].change)).toBe('number');
  }

  done();
});

test('/ticker/?symbol=ETH%2FBTC&exchange=bx', async (done) => {
  const response = await request(app)
    .get('/ticker/')
    .query({
      symbol: 'ETH/BTC',
      exchange: 'bx',
    })
    .send();

  expect(response.statusCode).toBe(200);
  const exchange = response.body;
  expect(exchange).toHaveProperty('price');
  expect(typeof exchange.price).toBe('string');
  expect(typeof parseFloat(exchange.price)).toBe('number');

  done();
});


test('/ticker/?symbol=BTC%2FUSDT&exchange=kucoin', async (done) => {
  const response = await request(app)
    .get('/ticker/')
    .query({
      symbol: 'BTC/USDT',
      exchange: 'kucoin',
    })
    .send();

  expect(response.statusCode).toBe(200);
  const exchange = response.body;
  expect(exchange).toHaveProperty('price');
  expect(typeof exchange.price).toBe('string');
  expect(typeof parseFloat(exchange.price)).toBe('number');

  done();
});



test('/ticker/?symbol=BTC%2FUSDT&exchange=huobi', async (done) => {
  const response = await request(app)
    .get('/ticker/')
    .query({
      symbol: 'BTC/USDT',
      exchange: 'huobi',
    })
    .send();

  expect(response.statusCode).toBe(200);
  const exchange = response.body;
  expect(exchange).toHaveProperty('price');
  expect(typeof exchange.price).toBe('string');
  expect(typeof parseFloat(exchange.price)).toBe('number');

  done();
});



test('/ticker/?symbol=BTC%2FUSDT&exchange=binance', async (done) => {
  const response = await request(app)
    .get('/ticker/')
    .query({
      symbol: 'BTC/USDT',
      exchange: 'binance',
    })
    .send();

  expect(response.statusCode).toBe(200);
  const exchange = response.body;
  expect(exchange).toHaveProperty('price');
  expect(typeof exchange.price).toBe('string');
  expect(typeof parseFloat(exchange.price)).toBe('number');

  done();
});
