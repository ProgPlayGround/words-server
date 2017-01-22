var mongojs = require('mongojs');
var jwt = require('jsonwebtoken');
var config = require('../config');
var redisClient = require('../common/redisConnection');
var https = require('https');

function authorization(req, res, next) {

  var authType = req.headers['auth-type'];
  var token = req.headers['auth-token'];

  if(auth[authType]) {
    auth[authType](token, res, next);
  } else {
    return res.status(400).send({
      'success': false,
      'message': 'Inccorect auth method'
    });
  }
}

var auth = {
  basic: function(token, res, next) {
    var encoded = new Buffer(token, 'base64').toString('ascii');
    var credentials = encoded.split(':');
    var login = credentials[0];
    token = credentials[1];
    if(login && token) {
      jwt.verify(token, config.jwtSecret, function(err, decoded) {
        if(err) {
          throw err;
        } else if(decoded.name != login) {
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
              res.locals.user = login;
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
      path: '/debug_token?input_token=' + token + '&access_token=' + config.fbToken,
      method: 'GET'
    }, function(fbRes) {
      if(fbRes.statusCode == 200) {
        fbRes.setEncoding('utf8');
        fbRes.on('data', function (body) {
          var fbBody = JSON.parse(body);
          res.locals.user = fbBody.data.user_id;
          next();
        });
      } else {
        return res.status(403).send({
          'success': false,
          'message': 'Incorrect token'
        });
      }
    }).end();
  }
}

module.exports = authorization;
