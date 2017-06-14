var router = require('express').Router();
var config = require('../config');
var configSecurity = require('../config-security');

var mongojs = require('mongojs');
var storage = require('../common/storage');
var db = mongojs(config.dbUrl);

var multer = require('multer');
var upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: config.maxFileSize,
    files: 1
  }
});
var Flickr = require("flickrapi"),
flickrConfig = {
    api_key: configSecurity.flickrKey,
    secret: configSecurity.flickrSecret
};

router.get('/:word', function(req, res, next) {
  Flickr.tokenOnly(flickrConfig, function(err, flickr) {
    flickr.photos.search({
      text: req.params.word,
      per_page: 1
    }, function(err, result) {
      if(err) {
         throw err;
      } else {
        flickr.photos.getSizes({
          photo_id: result.photos.photo[0].id
        }, function(err, photos) {
          if(err) {
            throw err;
          }
          return res.status(200).json({
            'success': true,
            'data': photos.sizes.size[0].source
          });
        });
      }
    });
  });
});

router.post('/:word', upload.any(), function(req, res, next) {
  db.collection('dictionary').findOne({word: req.params.word}, {_id:1}, function(err, data) {
    if(err) {
      throw err;
    } else if(!data) {
      res.status(404).send({
        'success': false,
        'err': 'word doesn\'t exist'
      });
    } else {
      storage.upload(req.params.word, config.s3ImgBucket, req.files[0].buffer)
      .then(function(response) {
        db.collection('dictionary').update({'_id': data._id}, {
          $set: {
            'imageUrl': response
          }
        }, function(err, result) {
          if(err) {
            throw err;
          } else {
            return res.status(200).json({
              'success': true,
              'url': response
            });
          }
        });
      });
    }
  });
});

module.exports = router;
