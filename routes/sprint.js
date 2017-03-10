var router = require('express').Router();
var config = require('../config');
var dbUrl = config.dbUrl;
var mongojs = require('mongojs');
var db = mongojs(dbUrl + 'dictionary');

router.get('/', function(req, res, next) {
  db.collection('sprint').find({}, {_id:0}).toArray(function(err, data) {
    res.send(data);
  });
});

module.exports = router;
