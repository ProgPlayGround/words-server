var router = require('express').Router();
var dbUrl = require('../config').dbUrl;
var mongojs = require('mongojs');
var db = mongojs(dbUrl);

router.get('/', function(req, res, next) {
  db.collection('dictionary').find({}, {_id:0}).toArray(function(err, data) {
    res.send(data);
  });
});

module.exports = router;
