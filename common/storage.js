var aws = require('aws-sdk');
var s3Server = require('../config').s3Server;
var s3 = new aws.S3();

var Q = require('q');

module.exports = {
  upload: function(word, bucket, stream) {
    return Q.Promise(function(resolve, reject) {
        s3.putObject({
          Bucket: bucket,
          Key: word,
          Body: stream
        }, function(err, s3Response) {
          if (err) {
            reject(err);
         } else {
           var url = 'https://' + s3Server + '.amazonaws.com/' + bucket + '/' + word;
           resolve(url);
         }
        });
      });
  },
  get: function(word, bucket) {
    return Q.Promise(function(resolve, reject) {
      s3.headObject({
        Bucket: bucket,
        Key: word
      }, function(err, s3Response) {
        if (err) {
          reject(err);
        } else {
          var url = 'https://' + s3Server + '.amazonaws.com/' + bucket + '/' + word;
          resolve(url);
        }
      });
    });
  }
};
