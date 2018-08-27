const express = require('express');

const router = express.Router();
const symbol = require('../model/symbol');

router.get('/list', function (req, res) {
    res.send(Object.keys(symbol.carboneum));
});

module.exports = router;