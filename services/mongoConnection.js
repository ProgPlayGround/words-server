var mongo = require('mongodb').MongoClient;

module.exports = function(name, callback) {
  mongo.connect('mongodb://localhost:27017/' + name, function(err, db) {
    if(err) {
      throw err;
    }
    callback(db);
  });
};
