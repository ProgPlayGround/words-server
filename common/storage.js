var aws = require('aws-sdk');
var config = require('../config');
var s3 = new aws.S3();

module.exports = function(word, stream, callback) {
    s3.putObject({
    Bucket: config.s3BucketName,
    Key: word,
    Body: stream
  }, function(err, s3Response) {
    if (err) {
      throw err;
   } else {
     var url = 'https://' + config.s3Server + '.amazonaws.com/' + config.s3BucketName + '/' + word;
     callback(url);
   }
  });
}
