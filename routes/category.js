var router = require('express').Router();
var mongojs = require('mongojs');
var debug = require('debug')('words-server:category');

var config = require('../config');
var db = mongojs(config.dbUrl);

var storage = require('../common/storage');

var multer = require('multer');
var upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxFileSize,
    files: 1
  }
});

var Q = require('q');

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
      return res.send(data.category);
    }
  });
});

router.post('/:user/:category', upload.any(), function(req, res, next) {
  if(checkAccess(req, res)) {
    return res.status(401).json({
      'success': false,
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
      var existingCategory = data.category.find(function(elem) {
        return elem.name === req.params.category;
      });
      if(existingCategory) {
        return res.status(409).json({
          'success': false,
          'err': 'category is already present'
        });
      } else {
        
        var promise = Q.fcall(function() {
          return {
            'name': req.params.category
          };
        }).then(function(category) {
          if(req.files) {
            return storage.upload('category-' + req.params.category, config.s3ImgBucket, req.files[0].buffer)
              .then(function(response) {
                return {
                  'name': req.params.category,
                  'imageUrl': response
                };
              }).catch(function(err) {
                debug('Error occured while uploading category img, %s', err);
                return {
                  'name': req.params.category,
                };
              });
          } else {
            return category;
          }
        }).then(function(category) {
          data.category.push(category);
          db.collection('user').update({'_id': mongojs.ObjectId(req.params.user)}, {
            $set: {
              'category': data.category
            }
          }, function(err, result) {
            if(err) {
              throw err;
            } else {
              return res.status(200).json({
                'success': true,
                'category' : category
              });
            }
          });
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
  db.collection('user').update({_id: mongojs.ObjectId(req.params.user)}, {$pull: {'category': {'name': req.params.category}}},
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
        'success': data.nModified > 0 ? true : false
      });
    }
  });
});

module.exports = router;
