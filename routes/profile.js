var router = require('express').Router();
var ObjectID = require('mongodb').ObjectID;
var db;
require('../services/mongoConnection')('users', function(mongo) {
  db = mongo;
});

router.get('/', function(req, res, next) {
  db.collection('profile').findOne({'_id': ObjectID('586935ac751c86c41182fe7f')}, function(err, data) {
    console.log(err);
    res.send(data);
  });
});

module.exports = router;
