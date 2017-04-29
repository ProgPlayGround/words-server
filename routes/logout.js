var router = require('express').Router();
var redisClient = require('../common/redisConnection');

router.post('/', function(req, res, next) {
  redisClient.set(res.locals.token, res.locals.decoded.name);
  redisClient.expireat(res.locals.token, res.locals.decoded.expires);

  return res.status(200).json({
    'success': true
  });
});

module.exports = router;
