var router = require('express').Router();
var jwt = require('jsonwebtoken');
var secret = require('../config').secret;

var db;
require('../services/mongoConnection')('users', function(mongo) {
  db = mongo;
});

var requestValidator = function(req, res, next) {
    if(!req.body.username || !req.body.password) {
      res.status(400).send({
        'success': false,
        'message': 'User info should be specified'
      });
    } else {
      next();
    }
};

router.post('/registration', function(req, res, next) {
  var user = {
    '_id': req.body.username,
    'password': req.body.password
  };
  db.collection('user').insert(user, {w:1}, function(err, data) {
    if(err) {
      res.status(400).send({
        'success': false,
        'message': 'User already exist'
      });
    } else {
      var token = jwt.sign({'username': user._id}, secret, {
        expiresIn: '30m'
      });

      res.json({
        'success': true,
        'token': token
      });
    }
  });
});

router.post('/login', function(req, res, next) {
  var user = {'_id': req.body.username, 'password': req.body.password};
  db.collection('user').findOne(user, function(err, data) {
    if(err) {
      res.status(500).send({
        'success': false,
        'message': err
      });
    } else if(!data) {
      res.status(401).send({
        'success': false,
        'message': 'Wrong credentials'
      });
    } else {
      var token = jwt.sign({'username': user._id}, secret, {
        expiresIn: '30m'
      });

      res.json({
        'success': true,
        'token': token
      });
    }});
  });

module.exports = {
  'api': router,
  'interceptor': requestValidator
};
