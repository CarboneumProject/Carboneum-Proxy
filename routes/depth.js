var express = require('express');
var router = express.Router();
var binance = require('../model/binance');
/* GET home page. */
router.get('/', function(req, res, next) {
    binance.depth(req, res);
});



module.exports = router;
