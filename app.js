var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var validateSignature = require('./model/validate-signature.js');

var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');

// routes//
var depthRouter = require('./routes/depth');
var newOrderRouter = require('./routes/order');
var allOrderRouter = require('./routes/allorder');
var accountRouter = require('./routes/account');
var getValRouter = require('./routes/getval');

var app = express();
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

//path//
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/depth', depthRouter);
app.use('/order', newOrderRouter);
app.use('/allOrders', allOrderRouter);
app.use('/account', accountRouter);
app.use('/getval', getValRouter);
app.post('/sign-in', function (req, res) {
  const addressFromSign = validateSignature(req.body.signed);
  // noinspection JSUnresolvedFunction
  if (addressFromSign.toLowerCase() === req.body.account.toLowerCase()) {
    res.send({ 'success': true });
  } else {
    res.send({ 'success': false });
  }
});
// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send({
    code: err.code,
    msg: err.message
  });
});

module.exports = app;
