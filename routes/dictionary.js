var router = require('express').Router();
var mongojs = require('mongojs');
var dbUrl = require('../config').dbUrl;
var db = mongojs(dbUrl + 'dictionary');

router.get('/', function(req, res, next) {
  db.collection('basic').find({}, {_id:0}).toArray(function(err, data) {
    res.send(data);
  });
});

module.exports = router;
