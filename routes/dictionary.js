var router = require('express').Router();
var mongojs = require('mongojs');

var aws = require('aws-sdk');
var config = require('../config');
var db = mongojs(config.dbUrl + 'dictionary');

var Polly = new aws.Polly({
    signatureVersion: config.pollySignatureVersion,
    region: config.pollyServer
});

var s3 = new aws.S3();

function getSpeech(word, error, success) {
  Polly.synthesizeSpeech({
      'Text': word,
      'OutputFormat': config.pollyAudioFormat,
      'VoiceId': config.pollyVoice
  }, function(err, data) {
    if (data) {
      success(data);
    } else {
      error(err);
    }
  });
}


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
        s3.putObject({
          Bucket: config.s3BucketName,
          Key: req.body.word,
          Body: audio.AudioStream
        }, function(err, s3Response) {
          if (err) {
            throw err;
         } else {
           var url = 'https://' + config.s3Server + '.amazonaws.com/' + config.s3BucketName + '/' + req.body.word;
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
         }
       });
      });
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

module.exports = router;
