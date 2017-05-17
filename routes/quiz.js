var router = require('express').Router();
var dbUrl = require('../config').dbUrl;
var supportedLang = config.languages.split(',');
var mongojs = require('mongojs');
var db = mongojs(dbUrl);

router.get('/:lang', function(req, res, next) {
  if(supportedLang.indexOf(req.params.lang) === -1) {
    return res.status(404).send({
      'success': false,
      'message': 'Not supported language'
    });
  }
  db.collection('quiz_' + req.params.lang).find({}, {_id:0}).toArray(function(err, data) {
    res.send(data);
  });
});

module.exports = router;
