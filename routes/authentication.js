var router = require('express').Router();
var jwt = require('jsonwebtoken');
var mongojs = require('mongojs');
var config = require('../config');
var redisClient = require('../common/redisConnection');

var db = mongojs(config.dbUrl + 'users');

var createToken = function(user) {
  return jwt.sign({'id': user, 'key': config.jwtKey }, config.secret, { expiresIn: '30m' });;
}

function validateCredentials(req, res) {
  if(!req.body.username || !req.body.password) {
    res.status(400).send({
      'success': false,
      'message': 'No credentials specified'
    });
  }
}

router.post('/registration', function(req, res, next) {

  validateCredentials(req, res);

  var user = {
    '_id': req.body.username
  };

  db.collection('user').findOne(user, function(err, data) {
    if(err) {
      res.status(500).send({
        'success': false,
        'message': err
      });
    } else if(data) {
      res.status(400).send({
        'success': false,
        'message': 'User already exist'
      });
    } else {
      //TODO: validate password
      user.password = req.body.password;
      db.collection('user').insert(user, function(err, data) {
        if(err) {
          res.status(500).send({
            'success': false,
            'message': err
          });
        } else {
          res.status(200).json({
            'success': true,
            'token': createToken(req.body.username)
          });
        }
      });
    }
  });
});

router.post('/login', function(req, res, next) {

  validateCredentials(req, res);
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
        'message': 'Wrong credentials specified'
      });
    } else {
      res.status(200).json({
        'success': true,
        'token': createToken(req.body.username)
      });
    }});
  });

  router.post('/logout', function(req, res, next) {
    var token = req.body.token || req.query.token || req.headers['x-access-token'];
    if(token) {
     jwt.verify(token, config.secret, function(err, decoded) {
       if(err) {
         return res.status(400).send({
           'success': false,
           'message': 'Credentials are incorect'
         });
       } else {
         redisClient.set(token, decoded.id);
         redisClient.expireat(token, decoded.exp);

         return res.status(200).json({
           'success': true
         });
       }
     });
    } else {
       return res.status(400).send({
         'success': false,
         'message': 'Credentials isn\'t provided'
       });
    }
  });

module.exports = router;
