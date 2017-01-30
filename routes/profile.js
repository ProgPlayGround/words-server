var router = require('express').Router();
var dbUrl = require('../config').dbUrl;
var ObjectID = require('mongodb').ObjectID;
var mongojs = require('mongojs');
var db = mongojs(dbUrl + 'users');

router.get('/', function(req, res, next) {
  db.collection('profile').findOne({'_id': ObjectID('586935ac751c86c41182fe7f')}, function(err, data) {
    res.send(data);
  });
});

module.exports = router;
