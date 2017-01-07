var mongo = require('mongodb').MongoClient;

module.exports = function(database, callback) {
  mongo.connect('mongodb://localhost:27017/' + database, function(err, db) {
    if(err) {
      throw err;
    }
    callback(db);
  });
};
