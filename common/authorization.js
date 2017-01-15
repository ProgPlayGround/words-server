var mongojs = require('mongojs');
var config = require('../config');
var db = mongojs(config.dbUrl + 'users');

function authorization(req, res, next) {

  var token = req.headers['authorization'];

  var encoded = new Buffer(token.replace('Basic ', ''), 'base64').toString('ascii');
  var credentials = encoded.split(':');
  var login = credentials[0];
  var password = credentials[1];
  if(login && password) {
    db.collection('user').findOne({'_id': login, 'sha': password}, function(err, data) {
      if(err) {
        throw err;
      } else if(!data) {
        res.status(401).send({
          'success': false,
          'message': 'User doesn\'t exists'
        });
      } else {
        next();
      }
    });
   } else {
     return res.status(403).send({
       'success': false,
       'message': 'Credentials doesn\'t exists'
     });
   }
}

module.exports = authorization;
