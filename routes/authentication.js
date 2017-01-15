var router = require('express').Router();
var crypto = require('crypto');
var mongojs = require('mongojs');
var config = require('../config');
var db = mongojs(config.dbUrl + 'users');

function decodeCredentials(salt, password, callback) {
  var withSecret = salt + config.secret;
  crypto.pbkdf2(password, withSecret, 50, 512, 'sha512', callback);
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
      throw err;
    } else if(data) {
      res.status(400).send({
        'success': false,
        'message': 'User already exist'
      });
    } else {
      var salt = crypto.randomBytes(128).toString('base64');
      decodeCredentials(salt, req.body.password, function(err, key) {
        if(err) {
          throw err;
        } else {
          user.sha = key.toString('hex');
          user.salt = salt;
          db.collection('user').insert(user, function(err, data) {
            if(err) {
              throw err;
            } else {
              res.status(200).json({
                'success': true,
                'token': user.sha
              });
            }
          });
        }
      });
    }
  });
});

router.post('/login', function(req, res, next) {

  validateCredentials(req, res);

  var user = {'_id': req.body.username };

  db.collection('user').findOne(user, function(err, data) {
    if(err) {
      throw err;
    } else if(!data) {
      res.status(401).send({
        'success': false,
        'message': 'User doesn\'t exists'
      });
    } else {
      decodeCredentials(data.salt, req.body.password, function(err, key) {
        if(err) {
          throw err;
        } else if(data.sha == key.toString('hex')) {
          res.status(200).json({
            'success': true,
            'token': data.sha
          });
        } else {
          res.status(401).send({
            'success': false,
            'message': 'Wrong credentials'
          });
        }
      });
    }});
  });

module.exports = router;
