var router = require('express').Router();
var Translate = require('@google-cloud/translate');

function translateText (input, target) {

  var translate = Translate();
  return translate.translate(input, target)
    .then(function(results) {
      return results[0];
    });
};

router.get('/:word', function(req, res, next) {
  translateText(req.params.word, 'ru').then(function(translation) {
    res.status(200).json([
      translation
    ]);
  }, function(err) {
    res.status(500).json({
      err
    });
  });
});

module.exports = router;
