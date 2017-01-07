var jwt = require('jsonwebtoken');
var secret = require('../config').secret;

function authorization(req, res, next) {
  var token = req.body.token || req.query.token || req.headers['x-access-token'];
  if(token) {
    jwt.verify(token, secret, function(err, decoded) {
      if(err) {
        return res.status(403).send({
          'success': false,
          'message': 'Failed to authenticate token'
        });
      } else {
        next();
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
