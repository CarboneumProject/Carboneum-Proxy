const request = require('supertest');
const app = require('../app');
var redis = require("redis"),
    client = redis.createClient();
const {promisify} = require('util');
const getAsync = promisify(client.get).bind(client);
const setAsync = promisify(client.set).bind(client);

test('GET value', async function (done) {
    //random api_key and secret_key
    let api_key = Math.random().toString();
    let secret_key = Math.random().toString();

    let exchange = 'bx';

    await setAsync(exchange + ":API_KEY", "");
    await setAsync(exchange + ":SECRET_KEY", "");

    const sellResponse = await request(app)
        .post('/getval/')
        .query({exchange: exchange})
        .send({
            'API_KEY': api_key,
            'SECRET_KEY': secret_key,
        })
        .set('Accept', 'text/plain');

    expect(sellResponse.text).toBe("Success to added");

    let res = await getAsync(exchange + ":API_KEY");
    expect(res).toBe(api_key);
    console.log(res);

    res = await getAsync(exchange + ":SECRET_KEY");
    expect(res).toBe(secret_key);
    console.log(res);
    done();
});