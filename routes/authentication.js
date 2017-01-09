var router = require('express').Router();
var jwt = require('jsonwebtoken');
var mongojs = require('mongojs');
var config = require('../config');

var db = mongojs(config.dbUrl + 'users');

var createSession = function(user) {
  var session = {};
  session.token = jwt.sign(user, config.secret);
  var expires = new Date();
  session.expires = expires.setMinutes(expires.getMinutes() + 1);
  return session;
}

router.post('/registration', function(req, res, next) {

  if(!req.body.username || !req.body.password) {
    res.status(400).send({
      'success': false,
      'message': 'No credentials specified'
    });
  }

  var user = {
    '_id': req.body.username
  };

  db.collection('user').findOne(user, function(err, data) {
    if(err) {
      res.status(500).send({
        'success': false,
        'message': err
      });
    } else if(data) {
      res.status(401).send({
        'success': false,
        'message': 'User already exist'
      });
    } else {
      //TODO: validate password
      user.password = req.body.password;
      user.session = createSession(user);
      db.collection('user').insert(user, function(err, data) {
        if(err) {
          res.status(500).send({
            'success': false,
            'message': err
          });
        } else {
          res.status(200).json({
            'success': true,
            'token': user.session.token
          });
        }
      });
    }
  });
});

router.post('/login', function(req, res, next) {

  if(!req.body.username || !req.body.password) {
    res.status(400).send({
      'success': false,
      'message': 'No credentials specified'
    });
  }

  var user = {'_id': req.body.username, 'password': req.body.password};
  db.collection('user').findOne(user, function(err, data) {
    if(err) {
      res.status(500).send({
        'success': false,
        'message': err
      });
    } else if(!data) {
      res.status(401).send({
        'success': false,
        'message': 'Wrong credentials specified'
      });
    } else {
      var session = createSession({'_id': req.body.username});

      db.collection('user').update(user, {$set: {'session': session}},
      function(err, data) {
        if(err) {
          res.status(500).send({
            'success': false,
            'message': err
          });
        } else {
          res.status(200).json({
            'success': true,
            'token': session.token
          });
        }
      });
    }});
  });

  router.post('/logout', function(req, res, next) {
    if(req.body.username && req.body.token) {
     var session = db.collection('user').findAndModify({
       query: {'_id': req.body.username, 'session.token': req.body.token},
       update: {$set: {'session': {}}}
     }, function(err, user) {
       if(err) {
         return res.status(403).send({
           'success': false,
           'message': 'Failed to logout'
         });
       } else {
         return res.status(200).json({
           'success': true
         });
       }
     });
    } else {
       return res.status(403).send({
         'success': false,
         'message': 'No token provided'
       });
    }
  });

module.exports = router;
