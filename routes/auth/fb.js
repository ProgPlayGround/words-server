var router = require('express').Router();
var mongojs = require('mongojs');
var objId = mongojs.ObjectId;
var dbUrl = require('../../config').dbUrl;
var db = mongojs(dbUrl);

var template = "0".repeat(24);

function createObectId(id) {
  return objId((template + id).slice(-24));
}

router.post('/registration', function(req, res, next) {
  if(req.body.userId === res.locals.user) {
    db.collection('user').findOne({'_id': createObectId(req.body.userId)}, function(err, data) {
      if(err) {
        throw err;
      } else if(data) {
        return res.status(200).json({
          'success': true,
          'userId': data._id
        });
      } else {

        db.collection('user').insert({'_id': createObectId(req.body.userId)}, function(err, obj) {
          if(err) {
            throw err;
          } else {
            return res.status(200).json({
              'success': true,
              'userId': obj._id
            });
          }
        });
      }
    });
  } else {
    return res.status(400).send({
      'success': false,
      'errorCode': 0,
      'message': 'Credentials isn\'t specified'
    });
  }
});

module.exports = router;
