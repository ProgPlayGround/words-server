var router = require('express').Router();
var mongojs = require('mongojs');

var config = require('../config');
var db = mongojs(config.dbUrl);

var auth = require('../common/authorization');
var getSpeech = require('../common/audio');
var storage = require('../common/storage');
var images = require('../common/images');
var examples = require('../common/examples');

var Q = require('q');

router.param('user', auth.validateUser);

router.get('/:user/:category', function(req, res, next) {
  db.collection('dictionary').find({user: req.params.user, category: req.params.category}, {_id:0}).toArray(function(err, data) {
    res.send(data);
  });
});

router.patch('/:user/:category', function(req, res, next) {
  db.collection('dictionary').findOne({user: req.params.user, category: req.params.category, word: req.body.word}, {_id:1, translation:1}, function(err, data) {
    if(err) {
      throw err;
    } else if(!data) {
      res.status(404).send({
        'success': false,
        'err': 'word doesn\'t exist'
      });
    } else {
      if(data.translation.indexOf(req.body.translation) === -1) {
        data.translation.push(req.body.translation);
        db.collection('dictionary').update({'_id': data._id}, {
          $set: {
            'translation': data.translation
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
          'err': 'translation was already present'
        });
      }
    }
  });
});

router.post('/:user/:category', function(req, res, next) {
  var word = {
    'word': req.body.word,
    'translation': req.body.translation
  };

  db.collection('dictionary').findOne({user: req.params.user, category: req.params.category, word: req.body.word}, {_id:0}, function(err, data) {
    if(err) {
      throw err;
    } else if(data) {
      res.status(200).send(data);
    } else {
      var speech = storage.get(req.body.word, config.s3BucketName)
      .catch(function(err) {
        return getSpeech(req.body.word).then(function(audio) {
          return storage.upload(req.body.word, config.s3BucketName, audio);
        });
      });

      Q.allSettled([speech, images(req.body.word), examples(req.body.word)])
      .then(function(result) {
        var wordCard = {
          'word': req.body.word,
          'category': req.params.category,
          'translation': [req.body.translation],
          'audioUrl': result[0].value,
          'imageUrl': result[1].value,
          'samples': result[2].value
        };
        db.collection('dictionary').insert(wordCard, function(err, data) {
          if(err) {
            throw err;
          } else {
            res.send(wordCard);
          }
        });
      });
    }
  });
});

router.delete('/:user/:category/:word/:translation', function(req, res, next) {
  db.collection('dictionary').findOne({user: req.params.user, category: req.params.category, word: req.params.word}, {_id:1, translation: 1}, function(err, data) {
    if(err) {
      throw err;
    } else if(!data) {
      return res.status(404).json({
        'success': false,
        'err': 'Word isn\'t present in dictionary'
      });
    } else {
      var index = data.translation.indexOf(req.params.translation);
      if(index !== -1) {
        data.translation.splice(index, 1);
        db.collection('dictionary').update({'_id': data._id}, {
          $set: {
            'translation': data.translation
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
        return res.status(400).json({
          'success': false,
          'err': 'Translation isn\'t bound with the word'
        });
      }
    }
  });
});

router.delete('/:user/:category/:word', function(req, res, next) {
  db.collection('dictionary').remove({user: req.params.user, category: req.params.category, word: req.params.word}, function(err, data) {
    if(err) {
      throw err;
    } else if(data) {
      res.status(200).json({
        'success': data.n > 0 ? true : false
      });
    } else {
      res.status(404).send({
        'success': false,
        'err': 'word doesn\'t exist'
      });
    }
  });
});

module.exports = router;
