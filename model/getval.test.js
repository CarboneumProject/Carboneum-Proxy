const request = require('supertest');
const app = require('../app');
const getval = require('../model/getval');
const redis = require("./redis");

let cookie;
const sign = process.env.SIGNED;

test('sign-in', async (done) => {
  const res = await request(app)
    .post('/sign-in/')
    .send({
      account: process.env.ACCOUNT,
      signed: sign
    });
  console.log(res.text);
  cookie = res.headers['set-cookie'];
  console.log(cookie);
  done();
});

test('set api key', async (done) => {
  //random api_key and secret_key
  let api_key = Math.random().toString();
  let secret_key = Math.random().toString();
  await redis.setAsync("5f65d5b06f6f6966b18aab75d09301aa5b71cbba6667ff944cce4b3a5a8267b0", "");
  await redis.setAsync("4405da96113c8b2b53b66ec6df8cadf0edca76243e3f5809d370ded5a90df20f", "");
  console.log(cookie);

  await request(app)
    .post('/getval/')
    .query({exchange: 'huobi'})
    .send({
      API_KEY: api_key,
      SECRET_KEY: secret_key
    })
    .set('cookie', cookie);

  let res = await getval.get(`${process.env.ACCOUNT}:huobi:API_KEY`, sign);
  expect(res).toBe(api_key);
  console.log(res);

  res = await getval.get(`${process.env.ACCOUNT}:huobi:SECRET_KEY`, sign);
  expect(res).toBe(secret_key);
  console.log(res);
  done();
});