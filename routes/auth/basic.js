var router = require('express').Router();
var crypto = require('crypto');
var mongojs = require('mongojs');
var jwt = require('jsonwebtoken');
var dbUrl = require('../../config').dbUrl;
var securityConfig = require('../../config-security');
var db = mongojs(dbUrl);

function decodeCredentials(salt, password, callback) {
  var withSecret = salt + securityConfig.secret;
  crypto.pbkdf2(password, withSecret, 10000, 512, 'sha512', callback);
}

function decodeCredentialsSync(salt, password) {
  var withSecret = salt + securityConfig.secret;
  return crypto.pbkdf2Sync(password, withSecret, 10000, 512, 'sha512');
}

function createJsonWebToken(object) {
  var expires = new Date();
  object.expires = expires.setMinutes(expires.getMinutes() + 65);
  return jwt.sign(object, securityConfig.jwtSecret, {
    expiresIn: '1h'
  });
}

function validateCredentials(req, res) {
  return (!req.body.email || !req.body.password);
}

router.post('/registration', function(req, res, next) {

  if(validateCredentials(req, res)) {
    return res.status(400).send({
      'success': false,
      'errorCode': 0,
      'message': 'Credentials isn\'t specified'
    });
  }

  var user = {
    'email': req.body.email
  };

  db.collection('user').findOne(user, function(err, data) {
    if(err) {
      throw err;
    } else if(data) {
      return res.status(400).send({
        'success': false,
        'errorCode': 1,
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
          db.collection('user').insert(user, function(err, obj) {
            if(err) {
              throw err;
            } else {
              return res.status(200).json({
                'success': true,
                'userId': obj._id,
                'token': createJsonWebToken({'name': obj._id})
              });
            }
          });
        }
      });
    }
  });
});

router.post('/login', function(req, res, next) {

  if(validateCredentials(req, res)) {
    return res.status(400).send({
      'success': false,
      'errorCode': 0,
      'message': 'Credentials isn\'t specified'
    });
  }

  var user = {'email': req.body.email };

  db.collection('user').findOne(user, function(err, data) {
    if(err) {
      throw err;
    } else if(!data) {
      return res.status(400).send({
        'success': false,
        'errorCode': 2,
        'message': 'User doesn\'t exists'
      });
    } else {
      decodeCredentials(data.salt, req.body.password, function(err, key) {
        if(err) {
          throw err;
        } else if(data.sha == key.toString('hex')) {
          return res.status(200).json({
            'success': true,
            'userId': data._id,
            'token': createJsonWebToken({'name': data._id})
          });
        } else {
          return res.status(401).send({
            'success': false,
            'errorCode': 3,
            'message': 'Incorrect password'
          });
        }
      });
    }});
  });

  router.post('/editPassword', function(req, res, next) {

    if(validateCredentials(req, res)) {
      return res.status(400).send({
        'success': false,
        'errorCode': 0,
        'message': 'Credentials isn\'t specified'
      });
    }

    var user = {
      'email': req.body.email
    };

    db.collection('user').findOne(user, function(err, curData) {
      if(err) {
        throw err;
      } else if(!curData) {
        return res.status(400).send({
          'success': false,
          'errorCode': 2,
          'message': 'User doesn\'t exists'
        });
      } else {
        var oldKey = decodeCredentialsSync(curData.salt, req.body.password);
        if(curData.sha != oldKey.toString('hex')) {
          return res.status(401).send({
            'success': false,
            'errorCode': 3,
            'message': 'Incorrect password'
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
                'token': createJsonWebToken({'name': curData._id})
              });
            }
          });
        }
      }
    });
  });

module.exports = router;
