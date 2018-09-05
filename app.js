if (process.env.NODE_ENV === 'production') {
  require('@google-cloud/trace-agent').start();
}

const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const validateSignature = require('./model/validate-signature');
const session = require('express-session');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

// routes//
const depthRouter = require('./routes/depth');
const newOrderRouter = require('./routes/order');
const allOrderRouter = require('./routes/allorder');
const accountRouter = require('./routes/account');
const getvalRouter = require('./routes/getval');
const tickerRouter = require('./routes/ticker');
const symbolRouter = require('./routes/symbol');
const klinesRouter = require('./routes/klines');

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({extended: false}));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// app.set('trust proxy', 1); // trust first proxy
app.use(session({
  secret: 'e53fff9376c3fcee6c2009efaf5c06d1',
  resave: false,
  saveUninitialized: true,
  cookie: {secure: process.env.NODE_ENV === 'production'}
}));

//path//
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/symbol', symbolRouter);
app.use('/depth', depthRouter);
app.use('/order', newOrderRouter);
app.use('/allOrders', allOrderRouter);
app.use('/account', accountRouter);
app.use('/getval', getvalRouter);
app.use('/ticker', tickerRouter);
app.use('/klines', klinesRouter);
app.post('/sign-in', function (req, res) {
  const addressFromSign = validateSignature(req.body.signed);
  // noinspection JSUnresolvedFunction
  if (addressFromSign.toLowerCase() === req.body.account.toLowerCase()) {
    res.send({'success': true});
    req.session.address = req.body.account;
    req.session.sign = req.body.signed;
    req.session.save(err => {
      if (err) console.log(err);
    });
    req.session.touch();
  } else {
    res.send({'success': false});
  }
});


// catch 404 and forward to error handler
// noinspection JSUnusedLocalSymbols
app.use(function (req, res, next) {
  res.status(404).send({
    code: 404,
    title: 'That resource was not found',
    description: ''
  });
});

// error handler
// noinspection JSUnusedLocalSymbols
app.use(function (err, req, res, next) {
  console.error(err.stack);
  res.status(500).send(err);
});

module.exports = app;
