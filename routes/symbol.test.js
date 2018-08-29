const request = require('supertest');
const app = require('../app');
const redis = require('../model/redis');

afterAll(async (done) => {
  await redis.end(false);
  done();
});

test('/symbol/list', async (done) => {
  const response = await request(app)
    .get('/symbol/list')
    .send();

  expect(response.statusCode).toBe(200);
  expect(Array.isArray(response.body)).toBe(true);

  const symbols = response.body;

  for (let i = 0; i < symbols.length; i++) {
    expect(typeof symbols[i]).toBe('string');
  }

  done();
});