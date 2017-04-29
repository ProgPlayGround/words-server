var aws = require('aws-sdk');
var config = require('../config');
var Polly = new aws.Polly({
    signatureVersion: config.pollySignatureVersion,
    region: config.pollyServer
});



module.exports = function getSpeech(word, error, success) {
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
