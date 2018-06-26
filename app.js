const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const logger = require('morgan');
const validateSignature = require('./model/validate-signature.js');
const session = require('express-session');

const indexRouter = require('./routes/index');
const usersRouter = require('./routes/users');

// routes//
const depthRouter = require('./routes/depth');
const newOrderRouter = require('./routes/order');
const allOrderRouter = require('./routes/allorder');
const accountRouter = require('./routes/account');
const getvalRouter = require('./routes/getval');

const app = express();
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
// app.set('trust proxy', 1); // trust first proxy
app.use(session({
    secret: 'keyboard cat',
    cookie: { secure: false }
}));

//path//
app.use('/', indexRouter);
app.use('/users', usersRouter);
app.use('/depth', depthRouter);
app.use('/order', newOrderRouter);
app.use('/allOrders', allOrderRouter);
app.use('/account', accountRouter);
app.use('/getval', getvalRouter);
app.post('/sign-in', function (req, res) {
  const addressFromSign = validateSignature(req.body.signed);
  // noinspection JSUnresolvedFunction
  if (addressFromSign.toLowerCase() === req.body.account.toLowerCase()) {
    res.send({ 'success': true });
    req.session.address = req.body.account;
    req.session.sign = req.body.signed;
    req.session.save(err => {
        console.log(err);
    })
  } else {
    res.send({ 'success': false });
  }
});


// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res) {
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
