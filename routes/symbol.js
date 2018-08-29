const express = require('express');

const router = express.Router();

router.get('/list', async (req, res) => {
  const symbol = await require('../model/symbol');
  res.send(Object.keys(symbol['carboneum']));
});

module.exports = router;