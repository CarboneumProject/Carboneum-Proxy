const request = require('supertest');
const app = require('../app');
const redis = require('../model/redis');

afterAll(async (done) => {
  await redis.end(false);
  done();
});

test('binance depth', function (done) {
  request(app)
    .get('/depth/')
    .query({exchange: 'binance', symbol: 'ETH/BTC', timestamp: Math.round(new Date().getTime() / 1000)})
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



test('bx depth', function (done) {
  request(app)
    .get('/depth/')
    .query({exchange: 'bx', symbol: 'ETH/BTC', timestamp: Math.round(new Date().getTime() / 1000)})
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
          expect(typeof depth['asks'][i][j]).toBe('string');
          expect(typeof depth['asks'][i][j]).toBe('string');
          expect(typeof parseFloat(depth['asks'][i][j])).toBe('number');
          expect(typeof parseFloat(depth['asks'][i][j])).toBe('number');
        }
      }
      for (let i = 0; i < depth['bids'].length; i++) {
        for (let j = 0; j < 2; j++) {
          expect(typeof depth['bids'][i][j]).toBe('string');
          expect(typeof depth['bids'][i][j]).toBe('string');
          expect(typeof parseFloat(depth['bids'][i][j])).toBe('number');
          expect(typeof parseFloat(depth['bids'][i][j])).toBe('number');
        }
      }
      done();
    });
});


test('huobi depth', function (done) {
  request(app)
    .get('/depth/')
    .query({exchange: 'huobi', symbol: 'ETH/BTC', timestamp: Math.round(new Date().getTime() / 1000)})
    .set('Accept', 'application/json')
    .then(response => {
      const depth = response.body;
      expect(depth).toHaveProperty('bids');
      expect(depth).toHaveProperty('asks');
      expect(Array.isArray(depth['bids'])).toBe(true);
      expect(Array.isArray(depth['asks'])).toBe(true);
      expect(depth['asks'].length).toBeGreaterThan(0);
      expect(depth['bids'].length).toBeGreaterThan(0);

      for (let i = 0; i < depth['bids'].length; i++) {
        for (let j = 0; j < 2; j++) {
          expect(typeof depth['bids'][i][j]).toBe('string');
          expect(typeof depth['bids'][i][j]).toBe('string');
          expect(typeof parseFloat(depth['bids'][i][j])).toBe('number');
          expect(typeof parseFloat(depth['bids'][i][j])).toBe('number');
        }
      }

      for (let i = 0; i < depth['asks'].length; i++) {
        for (let j = 0; j < 2; j++) {
          expect(typeof depth['asks'][i][j]).toBe('string');
          expect(typeof depth['asks'][i][j]).toBe('string');
          expect(typeof parseFloat(depth['asks'][i][j])).toBe('number');
          expect(typeof parseFloat(depth['asks'][i][j])).toBe('number');
        }
      }
      done();
    });
});


test('kucoin depth', function (done) {
  request(app)
    .get('/depth/')
    .query({exchange: 'kucoin', symbol: 'ETH/BTC', timestamp: Math.round(new Date().getTime() / 1000)})
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
          expect(typeof depth['asks'][i][j]).toBe('string');
          expect(typeof depth['asks'][i][j]).toBe('string');
          expect(typeof parseFloat(depth['asks'][i][j])).toBe('number');
          expect(typeof parseFloat(depth['asks'][i][j])).toBe('number');
        }
      }

      for (let i = 0; i < depth['bids'].length; i++) {
        for (let j = 0; j < 2; j++) {
          expect(typeof depth['bids'][i][j]).toBe('string');
          expect(typeof depth['bids'][i][j]).toBe('string');
          expect(typeof parseFloat(depth['bids'][i][j])).toBe('number');
          expect(typeof parseFloat(depth['bids'][i][j])).toBe('number');
        }
      }

      done();
    });
});
