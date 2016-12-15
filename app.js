var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');

var dictionary = require('./routes/dictionary');

var app = express();

app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

app.use('/dictionary', dictionary);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  var err = new Error('Not Found');
  err.status = 404;
  next(err);
});

// error handlers
if (app.get('env') === 'dev') {
  app.use(function(err, req, res, next) {
    res.status(err.status || 500)
    .json({
      message: err.message,
      error: err
    }).end();
  });
}

app.use(function(err, req, res, next) {
  res.status(err.status || 500).json({
    message: err.message
  }).end();
});

module.exports = app;
