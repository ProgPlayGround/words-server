var router = require('express').Router();
var jwt = require('jsonwebtoken');
var mongojs = require('mongojs');
var config = require('../config');
var redisClient = require('../common/redisConnection');

var db = mongojs(config.dbUrl + 'users');

var createSession = function(user) {
  var session = {};
  var expires = new Date();
  session.expires = expires.setMinutes(expires.getMinutes() + 30);
  session.token = jwt.sign({'id': user, 'expires': session.expires }, config.secret);
  return session;
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
            'session': createSession(req.body.username)
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
        'session': createSession(req.body.username)
      });
    }});
  });

  router.post('/logout', function(req, res, next) {
    if(req.body.token) {
     jwt.verify(req.body.token, config.secret, function(err, decoded) {
       if(err) {
         return res.status(400).send({
           'success': false,
           'message': 'Credentials are incorect'
         });
       } else {
         redisClient.set(req.body.token, decoded.id);
         redisClient.expireat(req.body.token, decoded.expires);

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
