var router = require('express').Router();
var crypto = require('crypto');

var db;
require('../services/mongoConnection')(function(mongo) {
  db = mongo;
});

router.post('/', function(req, res, next) {
  db.collection('user').insert({
    '_id': req.body.username,
    'password': req.body.password,
    'token': '',
    'expires': ''
  }, {w:1}, function(err, records) {
    if(err) {
      res.status(400).send({
        'message': 'User already exist'
      });
    } else {
      crypto.randomBytes(48, function(err, data) {
        if(err) {
          res.status(500).send({
            'message': err
          });
        } else {
          var expireDate = new Date();
          expireDate.setDate(expireDate.getDate() + 7);
          db.collection('user').update({'_id': req.body.username}, {$set:{'token': data, 'expires': expireDate}}, false, true);
          res.send({
            'token': data,
            'expires': expireDate
          });
        }
      });
    }
  });
});

module.exports = router;
