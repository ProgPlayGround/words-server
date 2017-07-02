var router = require('express').Router();
var config = require('../config');
var supportedLang = config.languages.split(',');
var auth = require('../common/authorization');
var filter = require('../common/searchCriteria').searchFilter;
var mongojs = require('mongojs');
var db = mongojs(config.dbUrl);

function getOptions(answers, correct) {
  return shuffleOptions(answers.length < 4 ? handleNotEnoughAnswers(answers) : prepareOptions(answers, correct));
}

function handleNotEnoughAnswers(answers) {
  var options = [];
  var pos = 0;
  do {
    options[pos] = answers[pos < answers.length ? pos : answers.length - 1];
  } while(++pos < 4);
  return options;
}

function prepareOptions(answers, correct) {
  var options = [correct];
  var pos = 1;
  do {
    var index = Math.floor(Math.random() * answers.length);
    if(options.indexOf(answers[index]) === -1) {
      options[pos++] = answers[index];
    }
  } while(pos < 4);
  return options;
}

function shuffleOptions(options) {
  var index = Math.floor(Math.random() * options.length);
  var temp = options[0];
  options[0] = options[index];
  options[index] = temp;
  return options;
}

router.param('user', auth.validateUser);

router.get('/:user/:category/:lang', function(req, res, next) {
  if(supportedLang.indexOf(req.params.lang) === -1) {
    return res.status(404).send({
      'success': false,
      'message': 'Not supported language'
    });
  }
  db.collection('dictionary').find(filter(req.params.user, req.params.category), {_id:0, audioUrl:0, imageUrl:0}, {limit: 50}, function(err, data) {
    if(err) {
      return res.status(500).send({
        'success': false,
        'message': err
      });
    } else if(data.length === 0) {
      return res.status(204).send({
        'success': true,
        'message': 'Missing data'
      });
    } else {
      var answers = data.map(function(elem) {
        return req.params.lang === 'en' ? elem.translation[0] : elem.word;
      });
      var quiz = data.map(function(elem) {
        return {
          'word': req.params.lang === 'en' ? elem.word : elem.translation[0],
          'answer': req.params.lang === 'en' ? elem.translation[0] : elem.word,
          'options': getOptions(answers, req.params.lang === 'en' ? elem.translation[0] : elem.word)
        }
      });
      return res.send(quiz);
    }
  });
});

module.exports = router;
