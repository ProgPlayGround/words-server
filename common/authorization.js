var jwt = require('jsonwebtoken');
var configSecurity = require('../config-security');
var redisClient = require('../common/redisConnection');
var https = require('https');
var crypto = require('crypto');

function token(req, res, next) {

  var authType = req.headers['auth-type'];
  var token = req.headers['auth-token'];

  if(auth[authType]) {
    auth[authType](token, res, next);
  } else {
    return res.status(403).send({
      'success': false,
      'message': 'Incorect auth method'
    });
  }
}

function validateUser(req, res, next) {
  if(res.locals.user === req.params.user) {
    next();
  } else {
    return res.status(403).json({
      'success': false,
      'err': 'You are prohibited from running request from this user'
    });
  }
}

var auth = {
  basic: function(token, res, next) {
    var encoded = new Buffer(token, 'base64').toString('ascii');
    var credentials = encoded.split(':');
    var userId = credentials[0];
    token = credentials[1];
    if(userId && token) {
      console.log(userId, token);
      jwt.verify(token, configSecurity.jwtSecret, function(err, decoded) {
        if(err) {
          console.log(err);
          throw err;
        } else if(decoded.name != userId) {
          res.status(403).send({
            'success': false,
            'message': 'Incorrect token'
          });
        } else {
          redisClient.exists(token, function(err, reply) {
            if(err) {
              throw err;
            } else if(reply) {
              res.status(403).send({
                'success': false,
                'message': 'Incorrect token'
              });
            } else {
              res.locals.decoded = decoded;
              res.locals.token = token;
              res.locals.user = userId;
              next();
            }
          });
        }
      });
     } else {
       return res.status(403).send({
         'success': false,
         'message': 'Credentials isn\'t specified'
       });
     }
  },
  fb: function(token, res, next) {
    https.request({
      host:'graph.facebook.com',
      path: '/debug_token?input_token=' + token + '&access_token=' + configSecurity.fbToken,
      method: 'GET'
    }, function(fbRes) {
      if(fbRes.statusCode == 200) {
        fbRes.setEncoding('utf8');
        fbRes.on('data', function (body) {
          var fbBody = JSON.parse(body);
          res.locals.user = 'fb' + fbBody.data.user_id;
          next();
        });
      } else {
        return res.status(403).send({
          'success': false,
          'message': 'Incorrect token'
        });
      }
    }).end();
  },
  vk: function(token, res, next) {
    var keys = token.split('&');
    var md5 = crypto.createHash('md5').update(keys[0] + configSecurity.vkSecret).digest('hex');
    if(md5 === keys[1]) {
      next();
    } else {
      return res.status(403).send({
        'success': false,
        'message': 'Incorrect token'
      });
    }
  }
}

module.exports = {
  authorization: token,
  validateUser: validateUser
};
