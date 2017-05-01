var aws = require('aws-sdk');
var config = require('../config');
var s3 = new aws.S3();

var Q = require('q');

module.exports = function(word, bucket, stream) {
  return Q.Promise(function(resolve, reject) {
      s3.putObject({
        Bucket: bucket,
        Key: word,
        Body: stream
      }, function(err, s3Response) {
        if (err) {
          reject(err);
       } else {
         var url = 'https://' + config.s3Server + '.amazonaws.com/' + bucket + '/' + word;
         resolve(url);
       }
      });
    });
};
