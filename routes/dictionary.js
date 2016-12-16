var router = require('express').Router();
var db;
require('../services/mongoConnection')(function(mongo) {
  db = mongo;
});

router.get('/', function(req, res, next) {
    db.collection('basic').find({}, {_id:0}).toArray(function(err, data) {
      res.send(data);
    });
});

module.exports = router;
