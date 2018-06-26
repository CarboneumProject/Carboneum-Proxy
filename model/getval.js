const redis = require("redis"),
    client = redis.createClient();
const CryptoJS = require("crypto-js");

const {promisify} = require('util');
const getAsync = promisify(client.get).bind(client);

let obj = {
    key: function (req, res) {
        let session_hash_api_key = CryptoJS.SHA256(req.session.address + ":" + req.query.exchange + ":API_KEY").toString();
        let session_hash_secret_key_aes = CryptoJS.SHA256(req.session.address + ":" + req.query.exchange + ":SECRET_KEY").toString();
        let api_key = CryptoJS.AES.encrypt(req.body.API_KEY, req.session.sign).toString();
        let secret_key = CryptoJS.AES.encrypt(req.body.SECRET_KEY, req.session.sign).toString();
        client.set(session_hash_api_key, api_key , redis.print);
        client.set(session_hash_secret_key_aes, secret_key, redis.print);
        console.log(session_hash_secret_key_aes);
        res.send("Success to added");

    },
    get: async function (key, sign) {
        console.log(key);
        let hash_key = CryptoJS.SHA256(key).toString();
        const value = await getAsync(hash_key);
        let decrypt_api = CryptoJS.AES.decrypt(value, sign).toString(CryptoJS.enc.Utf8);
        console.log(decrypt_api);
        return decrypt_api;

    }
};

module.exports = obj;