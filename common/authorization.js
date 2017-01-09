var jwt = require('jsonwebtoken');
var mongojs = require('mongojs');
var config = require('../config');
var db = mongojs(config.dbUrl + 'users');

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
         var session = db.collection('user').findOne({'_id': decoded._id}, {'_id': 0, 'session': 1},
          function(err, user) {
           if(user && user.session.token == token && user.session.expires > new Date()) {
             next();
           } else {
             return res.status(403).send({
               'success': false,
               'message': 'Failed to authenticate with token'
             });
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
