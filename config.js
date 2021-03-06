
module.exports = {
  'dbUrl': 'mongodb://' + process.env.HOST + ':27017/words',
  'languages': 'en,ua',
  'pollyServer': 'us-east-1',
  'pollySignatureVersion': 'v4',
  'pollyVoice': 'Joanna',
  'pollyAudioFormat': 'mp3',
  'maxActivities': 10,
  's3Server': 's3-us-west-1',
  's3BucketName': 'words-bucket',
  's3ImgBucket': 'user-loaded-images',
  'maxFileSize' : 100000
}
