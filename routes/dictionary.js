var express = require('express');
var router = express.Router();

router.get('/', function(req, res, next) {
  res.send('response from the dictionary');
});

module.exports = router;
