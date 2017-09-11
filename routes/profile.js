var router = require('express').Router();
var config = require('../config');
var db = require('mongojs')(config.dbUrl);
var auth = require('../common/authorization');
var storage = require('../common/storage');
var rank = require('../common/rank');
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
        return res.status(200).json({
          'name': req.body.name,
          'surname': req.body.surname,
          'age': calculateAge(new Date(req.body.birthday)),
          'avatar': profile.avatar
        });
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
    } else if(!data) {
      return res.status(204).send({
        'message': 'User doesn\'t exist'
      });
    } else {
      if(data.birthday) {
        data.age = calculateAge(new Date(data.birthday));
      }
      if(!data.rank) {
        data.rank = { points: 0, level: 0, upPoints: 1 };
      }
      data.rank.progress = data.rank.points / data.rank.upPoints;
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
    } else if(!data) {
      return res.status(204).send({
        'message': 'User doesn\'t exist'
      });
    } else {
      return updateProfile(req, res, data);
    }
  });
});


router.get('/:user/ranking', function(req, res, next) {
  db.collection('user').findOne({'_id': req.params.user}, {'_id': 0, 'rank': 1}, function(err, data) {
    if(err) {
      return res.status(500).send({
        'message': err
      });
    } else if(!data) {
      return res.status(204).send({
        'message': 'User doesn\'t exist'
      });
    } else {
      return res.send({
        'rank': data.rank.points || 0,
        'upPoints': data.rank.upPoints || 1
      });
    }
  });
});

router.patch('/:user/ranking', function(req, res, next) {
  if(isNaN(req.body.points)) {
    return res.status(400).send({
      'message': 'Rank should be a number'
    });
  }

  db.collection('user').findOne({'_id': req.params.user}, {'_id': 1, 'rank': 1}, function(err, data) {
    if(err) {
      return res.status(500).send({
        'message': err
      });
    } else if(!data) {
      return res.status(204).send({
        'message': 'User doesn\'t exist'
      });
    } else {

      var updated = updatedRankData(data, req.body.points);

      db.collection('user').update({'_id': req.params.user}, updated, function(err, result) {
        if(err) {
          throw err;
        } else {
          return res.send({
            'rank': updated.$set.rank.points,
            'upPoints': updated.$set.rank.upPoints
          });
        }
      });
    }
  });
});

function updatedRankData(data, inc) {
  var current = data.rank || { points: 0, level: 1, upPoints: 1 };
  var updated = {
    '$set':{}
  };

  current.points += inc;
  if(current.points >= current.upPoints) {
    current = rank(current.level + 1);

    updated.$push = {
      'activities': {
        $each: ['Congratulation, you have raised your horizon. Your level is <span class="activity-level">' + current.level + '</span>'],
        $position: 0,
        $slice: 10
      }
    }
  }
  updated.$set.rank = current;

  return updated;
}

module.exports = router;
