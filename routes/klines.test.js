const request = require('supertest');
const app = require('../app');
const redis = require('../model/redis');

afterAll(async (done) => {
  await redis.end(false);
  done();
});

test('binance klines', function (done) {
  // const time = new Date().getTime(); startTime: time - 86400, endTime: time
  request(app)
    .get('/klines/')
    .query({exchange: 'binance', symbol: 'ETH/BTC', limit: 61, interval: '1d'})
    .set('Accept', 'application/json')
    .then(response => {
      const klines = response.body;
      expect(Array.isArray(klines)).toBe(true);
      expect(klines.length).toBe(61);

      for (let i = 0; i < klines.length; i++) {
        expect(typeof klines[i][0]).toBe('number');
        expect(typeof klines[i][1]).toBe('string');
        expect(typeof parseFloat(klines[i][1])).toBe('number');
        expect(typeof klines[i][2]).toBe('string');
        expect(typeof parseFloat(klines[i][2])).toBe('number');
        expect(typeof klines[i][3]).toBe('string');
        expect(typeof parseFloat(klines[i][3])).toBe('number');
        expect(typeof klines[i][4]).toBe('string');
        expect(typeof parseFloat(klines[i][4])).toBe('number');
        expect(typeof klines[i][5]).toBe('string');
        expect(typeof parseFloat(klines[i][5])).toBe('number');
        expect(typeof klines[i][6]).toBe('number');
        expect(typeof klines[i][7]).toBe('string');
        expect(typeof parseFloat(klines[i][7])).toBe('number');
        expect(typeof klines[i][8]).toBe('number');
        expect(typeof klines[i][9]).toBe('string');
        expect(typeof parseFloat(klines[i][9])).toBe('number');
        expect(typeof klines[i][10]).toBe('string');
        expect(typeof parseFloat(klines[i][10])).toBe('number');
        expect(typeof klines[i][11]).toBe('string');
        expect(typeof parseFloat(klines[i][11])).toBe('number');
      }
      done();
    });
});

test('huobi klines', function (done) {
  // const time = new Date().getTime(); startTime: time - 86400, endTime: time
  request(app)
    .get('/klines/')
    .query({exchange: 'huobi', symbol: 'ETH/BTC', limit: 61, interval: '1d'})
    .set('Accept', 'application/json')
    .then(response => {
      const klines = response.body;
      console.log(klines);
      expect(Array.isArray(klines)).toBe(true);
      expect(klines.length).toBe(61);

      for (let i = 0; i < klines.length; i++) {
        expect(typeof klines[i][0]).toBe('number');
        expect(typeof klines[i][1]).toBe('string');
        expect(typeof parseFloat(klines[i][1])).toBe('number');
        expect(typeof klines[i][2]).toBe('string');
        expect(typeof parseFloat(klines[i][2])).toBe('number');
        expect(typeof klines[i][3]).toBe('string');
        expect(typeof parseFloat(klines[i][3])).toBe('number');
        expect(typeof klines[i][4]).toBe('string');
        expect(typeof parseFloat(klines[i][4])).toBe('number');
        expect(typeof klines[i][5]).toBe('string');
        expect(typeof parseFloat(klines[i][5])).toBe('number');
        expect(typeof klines[i][6]).toBe('number');
        expect(typeof klines[i][7]).toBe('string');
        expect(typeof parseFloat(klines[i][7])).toBe('number');
        expect(typeof klines[i][8]).toBe('number');
        expect(typeof klines[i][9]).toBe('string');
        expect(typeof parseFloat(klines[i][9])).toBe('number');
        expect(typeof klines[i][10]).toBe('string');
        expect(typeof parseFloat(klines[i][10])).toBe('number');
        expect(typeof klines[i][11]).toBe('string');
        expect(typeof parseFloat(klines[i][11])).toBe('number');
      }
      done();
    });
});

test('kucoin klines', function (done) {
  const limit = 61;
  const time = new Date().getTime();
  request(app)
    .get('/klines/')
    .query({exchange: 'kucoin', symbol: 'ETH/BTC', startTime: time - (86400 * 1000 * limit), endTime: time, interval: '1d'})
    .set('Accept', 'application/json')
    .then(response => {
      const klines = response.body;
      console.log(klines);
      expect(Array.isArray(klines)).toBe(true);
      expect(klines.length).toBe(61);

      for (let i = 0; i < klines.length; i++) {
        expect(typeof klines[i][0]).toBe('number');
        expect(typeof klines[i][1]).toBe('string');
        expect(typeof parseFloat(klines[i][1])).toBe('number');
        expect(typeof klines[i][2]).toBe('string');
        expect(typeof parseFloat(klines[i][2])).toBe('number');
        expect(typeof klines[i][3]).toBe('string');
        expect(typeof parseFloat(klines[i][3])).toBe('number');
        expect(typeof klines[i][4]).toBe('string');
        expect(typeof parseFloat(klines[i][4])).toBe('number');
        expect(typeof klines[i][5]).toBe('string');
        expect(typeof parseFloat(klines[i][5])).toBe('number');
        expect(typeof klines[i][6]).toBe('number');
        expect(typeof klines[i][7]).toBe('string');
        expect(typeof parseFloat(klines[i][7])).toBe('number');
        expect(typeof klines[i][8]).toBe('number');
        expect(typeof klines[i][9]).toBe('string');
        expect(typeof parseFloat(klines[i][9])).toBe('number');
        expect(typeof klines[i][10]).toBe('string');
        expect(typeof parseFloat(klines[i][10])).toBe('number');
        expect(typeof klines[i][11]).toBe('string');
        expect(typeof parseFloat(klines[i][11])).toBe('number');
      }
      done();
    });
});

test('bx klines', function (done) {
  // const time = new Date().getTime(); startTime: time - 86400, endTime: time
  request(app)
    .get('/klines/')
    .query({exchange: 'bx', symbol: 'ETH/BTC', interval: '1d'})
    .set('Accept', 'application/json')
    .then(response => {
      const klines = response.body;
      console.log(klines);
      expect(Array.isArray(klines)).toBe(true);

      for (let i = 0; i < klines.length; i++) {
        expect(typeof klines[i][0]).toBe('number');
        expect(typeof klines[i][1]).toBe('string');
        expect(typeof parseFloat(klines[i][1])).toBe('number');
        expect(typeof klines[i][2]).toBe('string');
        expect(typeof parseFloat(klines[i][2])).toBe('number');
        expect(typeof klines[i][3]).toBe('string');
        expect(typeof parseFloat(klines[i][3])).toBe('number');
        expect(typeof klines[i][4]).toBe('string');
        expect(typeof parseFloat(klines[i][4])).toBe('number');
        expect(typeof klines[i][5]).toBe('string');
        expect(typeof parseFloat(klines[i][5])).toBe('number');
        expect(typeof klines[i][6]).toBe('number');
        expect(typeof klines[i][7]).toBe('string');
        expect(typeof parseFloat(klines[i][7])).toBe('number');
        expect(typeof klines[i][8]).toBe('number');
        expect(typeof klines[i][9]).toBe('string');
        expect(typeof parseFloat(klines[i][9])).toBe('number');
        expect(typeof klines[i][10]).toBe('string');
        expect(typeof parseFloat(klines[i][10])).toBe('number');
        expect(typeof klines[i][11]).toBe('string');
        expect(typeof parseFloat(klines[i][11])).toBe('number');
      }
      done();
    });
});