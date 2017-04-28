var router = require('express').Router();

var configSecurity = require('../config-security');
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
          res.status(200).json({
            'success': true,
            'data': photos.sizes.size[0].source
          });
        });
      }
    });
  });
});

module.exports = router;
