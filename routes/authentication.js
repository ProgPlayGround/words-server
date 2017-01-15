var router = require('express').Router();
var crypto = require('crypto');
var mongojs = require('mongojs');
var config = require('../config');
var db = mongojs(config.dbUrl + 'users');

function decodeCredentials(salt, password, callback) {
  var withSecret = salt + config.secret;
  crypto.pbkdf2(password, withSecret, 50, 512, 'sha512', callback);
}

function decodeCredentialsSync(salt, password) {
  var withSecret = salt + config.secret;
  return crypto.pbkdf2Sync(password, withSecret, 50, 512, 'sha512');
}

function validateCredentials(req, res) {
  if(!req.body.username || !req.body.password) {
    return res.status(400).send({
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
      return res.status(400).send({
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
              return res.status(200).json({
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
      return res.status(400).send({
        'success': false,
        'message': 'User doesn\'t exists'
      });
    } else {
      decodeCredentials(data.salt, req.body.password, function(err, key) {
        if(err) {
          throw err;
        } else if(data.sha == key.toString('hex')) {
          return res.status(200).json({
            'success': true,
            'token': data.sha
          });
        } else {
          return res.status(401).send({
            'success': false,
            'message': 'Wrong credentials'
          });
        }
      });
    }});
  });

  router.post('/editPassword', function(req, res, next) {

    validateCredentials(req, res);

    var user = {
      '_id': req.body.username
    };

    db.collection('user').findOne(user, function(err, curData) {
      if(err) {
        throw err;
      } else if(!curData) {
        return res.status(401).send({
          'success': false,
          'message': 'Wrong credentials'
        });
      } else {
        var oldKey = decodeCredentialsSync(curData.salt, req.body.password);
        if(curData.sha != oldKey.toString('hex')) {
          return res.status(401).send({
            'success': false,
            'message': 'Wrong credentials'
          });
        } else {
          var salt = crypto.randomBytes(128).toString('base64');
          var newKey = decodeCredentialsSync(salt, req.body.newpassword);
          var updatedSha = newKey.toString('hex');
          db.collection('user').update(curData, {
            $set: {
              'sha': updatedSha,
              'salt': salt
            }
          }, function(err, result) {
            if(err) {
              throw err;
            } else {
              return res.status(200).json({
                'success': true,
                'token': updatedSha
              });
            }
          });
        }
      }
    });
  });

module.exports = router;
