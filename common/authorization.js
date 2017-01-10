var jwt = require('jsonwebtoken');
var mongojs = require('mongojs');
var config = require('../config');
var db = mongojs(config.dbUrl + 'users');
var redisClient = require('./redisConnection');

function authorization(req, res, next) {
  var token = req.body.token || req.query.token || req.headers['x-access-token'];

  if(token) {
    jwt.verify(token, config.secret, function(err, decoded) {
      if(err) {
       return res.status(403).send({
         'success': false,
         'message': 'Failed to authenticate with token'
       });
      } else {
       redisClient.exists(token, function(err, reply) {
         if(reply) {
           return res.status(403).send({
             'success': false,
             'message': 'Failed to authenticate with token'
           });
         } else {
           next();
         }
       });
      }
      });
   } else {
     return res.status(403).send({
       'success': false,
       'message': 'No token provided'
     });
   }
}

module.exports = authorization;
