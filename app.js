var express = require('express');
var path = require('path');
var logger = require('morgan');
var bodyParser = require('body-parser');

var dictionary = require('./routes/dictionary');
var quiz = require('./routes/quiz');
var basicAuth = require('./routes/auth/basic');
var fbAuth = require('./routes/auth/fb');
var profile = require('./routes/profile');
var sprint = require('./routes/sprint');
var logout = require('./routes/logout');
var translation = require('./routes/translation');
var image = require('./routes/image');
var category = require('./routes/category');
var auth = require('./common/authorization');

var app = express();

app.use(logger('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());

app.use(function(req, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS,PATCH');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization, Content-Length, X-Requested-With, auth-type, auth-token');
  next();
});

app.options('*', function(req, res) {
  res.sendStatus(200);
});

app.use('/authenticate', basicAuth);
app.use('/authenticate/fb', auth.authorization, fbAuth);
app.use('/dictionary', auth.authorization, dictionary);
app.use('/quiz', auth.authorization, quiz);
app.use('/profile', auth.authorization, profile);
app.use('/sprint', auth.authorization, sprint);
app.use('/logout', auth.authorization, logout);
app.use('/translation', auth.authorization, translation);
app.use('/image', auth.authorization, image);
app.use('/category', auth.authorization, category);

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
