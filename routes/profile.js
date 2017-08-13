var router = require('express').Router();
var config = require('../config');
var db = require('mongojs')(config.dbUrl);
var auth = require('../common/authorization');
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

router.param('user', auth.validateUser);

function updateProfile(req, res, initial) {
  Q.fcall(function() {
    return initial;
  }).then(function(profile) {
    if(req.files.length !== 0) {
      return storage.upload('profile-' + req.params.user, config.s3ImgBucket, req.files[0].buffer)
        .then(function(response) {
          profile.avatar = response;
          return profile;
        }).catch(function(err) {
          debug('Error occured while uploading users image, %s', err);
          return profile;
        });
    } else {
      return profile;
    }
  }).then(function(profile) {
    db.collection('user').update({'_id': req.params.user}, {
      $set: {
        'name': req.body.name,
        'surname': req.body.surname,
        'birthday': req.body.birthday,
        'avatar': profile.avatar
      }
    }, function(err, result) {
      if(err) {
        throw err;
      } else {
        return res.status(200).send();
      }
    });
  });
}

function calculateAge(birthday) {
   var ageDifMs = Date.now() - birthday.getTime();
   var ageDate = new Date(ageDifMs);
   return Math.abs(ageDate.getUTCFullYear() - 1970);
 }

router.get('/:user', function(req, res, next) {
  db.collection('user').findOne({'_id': req.params.user}, {'_id': 0, 'category': 0}, function(err, data) {
    if(err) {
      return res.status(500).send({
        'message': err
      });
    } else if(data.length === 0) {
      return res.status(204).send({
        'message': 'User doesn\'t exist'
      });
    } else {
      if(data.birthday) {
        data.age = calculateAge(new Date(data.birthday));
      }
      return res.send(data);
    }
  });
});

router.put('/:user', upload.any(), function(req, res, next) {
  db.collection('user').findOne({'_id': req.params.user}, function(err, data) {
    if(err) {
      return res.status(500).send({
        'message': err
      });
    } else if(data.length === 0) {
      return res.status(204).send({
        'message': 'User doesn\'t exist'
      });
    } else {
      return updateProfile(req, res, data);
    }
  });
});

module.exports = router;
