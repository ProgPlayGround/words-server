var router = require('express').Router();
var dbUrl = require('../config').dbUrl;
var ObjectID = require('mongodb').ObjectID;
var mongojs = require('mongojs');
var db = mongojs(dbUrl);

router.get('/', function(req, res, next) {
  db.collection('user').findOne({'_id': ObjectID('58a75c68f46f5e2d3aa9ee77')}, function(err, data) {
    res.send(data);
  });
});

module.exports = router;
