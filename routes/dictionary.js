var router = require('express').Router();
var mongojs = require('mongojs');

var config = require('../config');
var configSecurity = require('../config-security');
var db = mongojs(config.dbUrl + 'dictionary');

var getSpeech = require('../common/audio');
var storage = require('../common/storage');

var Flickr = require("flickrapi"),
flickrConfig = {
    api_key: configSecurity.flickrKey,
    secret: configSecurity.flickrSecret
};

router.get('/', function(req, res, next) {
  db.collection('dictionary').find({}, {_id:0}).toArray(function(err, data) {
    res.send(data);
  });
});

router.patch('/', function(req, res, next) {
  db.collection('dictionary').findOne({word: req.body.word}, {_id:1, translation:1}, function(err, data) {
    if(err) {
      throw err;
    } else if(!data) {
      res.status(404).send({
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
          'success': false
        });
      }
    }
  });
});

router.post('/', function(req, res, next) {
  var word = {
    'word': req.body.word,
    'translation': req.body.translation
  };

  db.collection('dictionary').findOne({word: req.body.word}, {_id:0}, function(err, data) {
    if(err) {
      throw err;
    } else if(data) {
      res.status(200).send(data);
    } else {
      getSpeech(req.body.word, function(err) {
        throw err;
      }, function(audio) {
        storage(req.body.word, audio.AudioStream, function(url) {
          var wordCard = {
            'word': req.body.word,
            'translation': [req.body.translation],
            'audioUrl': url
          };
          db.collection('dictionary').insert(wordCard, function(err, data) {
            if(err) {
              console.log(err);
            }
          });
          res.send(wordCard);
        });
      });
      // Flickr.tokenOnly(flickrConfig, function(err, flickr) {
      //   flickr.photos.search({
      //     text: "red+panda"
      //   }, function(err, result) {
      //     if(err) {
      //        throw new Error(err);
      //     } else {
      //       console.log(result);
      //     }
      //   });
      // });
    }
  });
});

router.delete('/:word/:translation', function(req, res, next) {
  db.collection('dictionary').findOne({word: req.params.word}, {_id:1, translation: 1}, function(err, data) {
    if(err) {
      throw err;
    } else if(!data) {
      return res.status(400).json({
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

router.delete('/:word', function(req, res, next) {
  db.collection('dictionary').remove({word: req.params.word}, function(err, data) {
    if(err) {
      throw err;
    } else if(data) {
      res.status(200).json({
        'success': data.n > 0 ? true : false
      });
    } else {
      res.status(500).json({
        'success': false
      });
    }
  });
});

module.exports = router;
