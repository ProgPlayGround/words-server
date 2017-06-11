var router = require('express').Router();
var mongojs = require('mongojs');
var debug = require('debug')('words-server:category');

var dbUrl = require('../config').dbUrl;
var db = mongojs(dbUrl);

function checkAccess(req, res) {
  return res.locals.user !== req.params.user;
}

router.get('/:user', function(req, res, next) {
  if(checkAccess(req, res)) {
    return res.status(401).json({
      'err': 'Not valid request'
    });
  }
  db.collection('user').findOne({_id: mongojs.ObjectId(req.params.user)}, {_id:0, category: 1}, function(err, data) {
    if(err) {
      throw err;
    } else {
      console.log(data);
      return res.send(data.category);
    }
  });
});

router.post('/:user', function(req, res, next) {
  if(checkAccess(req, res)) {
    return res.status(401).json({
      'err': 'Not valid request'
    });
  }
  db.collection('user').findOne({'_id': mongojs.ObjectId(req.params.user)}, {_id:0, category: 1}, function(err, data) {
    if(err) {
      throw err;
    } else {
      if(!data.category) {
        data.category = [];
      }
      if(data.category.indexOf(req.body.category) === -1) {
        data.category.push({'name': req.body.category});
        db.collection('user').update({'_id': mongojs.ObjectId(req.params.user)}, {
          $set: {
            'category': data.category
          }
        }, function(err, result) {
          if(err) {
            throw err;
          } else {
            return res.status(200).json({
              'success': true
            });
          }
        });
      } else {
        return res.status(409).json({
          'success': false,
          'err': 'category is already present'
        });
      }
    }
  });
});

router.delete('/:user/:category', function(req, res, next) {
  if(checkAccess(req, res)) {
    return res.status(401).json({
      'err': 'Not valid request'
    });
  }
  db.collection('user').update({_id: mongojs.ObjectId(req.params.user)}, {$pull: {'category': req.params.category}},
   function(err, data) {
    if(err) {
      throw err;
    } else {
      db.collection('dictionary').remove({user: req.params.user, category: req.params.category}, function(err, data) {
        if(err) {
          debug('Error removing words user: %s, category: %s', req.params.user, req.params.category);
        } else {
          debug('Remmoved %s words', data.n);
        }
      });
      res.status(200).json({
        'success': data.n > 0 ? true : false
      });
    }
  });
});

module.exports = router;
