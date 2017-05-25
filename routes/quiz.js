var router = require('express').Router();
var config = require('../config');
var supportedLang = config.languages.split(',');
var mongojs = require('mongojs');
var db = mongojs(config.dbUrl);

function getOptions(answers, correct) {
  var options = [correct];
  var pos = 1;
  do {
    var index = Math.floor(Math.random() * answers.length);
    if(options.indexOf(answers[index]) === -1) {
      options[pos++] = answers[index];
    }
  } while(pos < 4);

  return shuffleOptions(options);
}

function shuffleOptions(options) {
  var index = Math.floor(Math.random() * options.length);
  var temp = options[0];
  options[0] = options[index];
  options[index] = temp;
  return options;
}

router.get('/:lang', function(req, res, next) {
  if(supportedLang.indexOf(req.params.lang) === -1) {
    return res.status(404).send({
      'success': false,
      'message': 'Not supported language'
    });
  }
  db.collection('dictionary').find({}, {_id:0, audioUrl:0, imageUrl:0}, {limit: 50}, function(err, data) {
    if(err) {
      return res.status(500).send({
        'success': false,
        'message': err
      });
    } else {
      var answers = data.map(function(elem) {
        return elem.translation[0];
      });
      var quiz = data.map(function(elem) {
        return {
          "word": elem.word,
          "answer": elem.translation[0],
          "options": getOptions(answers, elem.translation[0])
        }
      });
      return res.send(quiz);
    }
  });
});

module.exports = router;
