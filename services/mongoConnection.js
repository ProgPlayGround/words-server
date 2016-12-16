var mongo = require('mongodb').MongoClient;

module.exports = function(callback) {
  mongo.connect('mongodb://localhost:27017/dictionary', function(err, db) {
    if(err) {
      throw err;
    }
    callback(db);
  });
};
