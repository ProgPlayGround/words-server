var mongojs = require('mongojs');
var jwt = require('jsonwebtoken');
var config = require('../config');
var redisClient = require('../common/redisConnection');

function authorization(req, res, next) {

  var token = req.headers['authorization'];
  var encoded = new Buffer(token.replace('Basic ', ''), 'base64').toString('ascii');
  var credentials = encoded.split(':');
  var login = credentials[0];
  var token = credentials[1];
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
}

module.exports = authorization;
