var aws = require('aws-sdk');
var config = require('../config');
var Polly = new aws.Polly({
    signatureVersion: config.pollySignatureVersion,
    region: config.pollyServer
});

var Q = require('q');

module.exports = function getSpeech(word) {
  return Q.Promise(function(resolve, reject) {
    Polly.synthesizeSpeech({
      'Text': word,
      'OutputFormat': config.pollyAudioFormat,
      'VoiceId': config.pollyVoice
  }, function(err, data) {
    if (data) {
      resolve(data.AudioStream);
    } else {
      reject(err);
    }
    });
  });
};
