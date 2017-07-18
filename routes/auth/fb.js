var router = require('express').Router();
var mongojs = require('mongojs');
var dbUrl = require('../../config').dbUrl;
var db = mongojs(dbUrl);

router.post('/registration', function(req, res, next) {
  if(req.body.userId === res.locals.user) {
    db.collection('user').findOne({'_id': req.body.userId}, function(err, data) {
      if(err) {
        throw err;
      } else if(data) {
        return res.status(400).send({
          'success': false,
          'errorCode': 1,
          'message': 'User already exist'
        });
      } else {
        db.collection('user').insert({'_id': req.body.userId}, function(err, obj) {
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
