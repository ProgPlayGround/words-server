var configSecurity = require('../config-security');

var Flickr = require('flickrapi'),
flickrConfig = {
    api_key: configSecurity.flickrKey,
    secret: configSecurity.flickrSecret
};

var Q = require('q');

module.exports = function(word) {
  return Q.Promise(function(resolve, reject) {
    Flickr.tokenOnly(flickrConfig, function(err, flickr) {
      flickr.photos.search({
        text: word,
        per_page: 1
      }, function(err, result) {
        if(err) {
           reject(err);
        } else if(result.photos.photo.length !== 0){
          flickr.photos.getSizes({
            photo_id: result.photos.photo[0].id
          }, function(err, photos) {
            if(err) {
              reject(err);
            } else {
              resolve(photos.sizes.size[0].source);
            }
          });
        } else {
          reject('Photo not found');
        }
      });
    });
  });
};
