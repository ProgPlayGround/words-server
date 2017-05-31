var http = require('http');
var Q = require('q');

function prepareDictionaryData(data) {
  return data.results.map(function(elem) {

    var definitions = elem.senses.reduce(function(result, elem) {
      if(elem.definition) {
        return result.concat(elem.definition);
      }
      return result;
    }, []);
    
    var examples = elem.senses.reduce(function(result, elem) {
      if(elem.examples) {
        return result.concat(elem.examples);
      }
      return result;
    }, []).reduce(function(result, elem) {
      if(elem.text) {
        result.push(elem.text);
      }
      return result;
    }, []);

    return {
      'word': elem.headword,
      'definitions': definitions,
      'sentences': examples
    };
  });
}

module.exports = function(word) {
  return Q.Promise(function(resolve, reject) {
    http.get('http://api.pearson.com/v2/dictionaries/ldoce5/entries?headword=' + word, function(res) {
      if(res.statusCode !== 200) {
        reject(res.statusCode);
      } else {
        var rawData = '';
        res.setEncoding('utf8');
        res.on('data', function(chunk) {
          rawData += chunk;
        });
        res.on('end', function() {
          try {
            var data = JSON.parse(rawData);
            resolve(prepareDictionaryData(data));
          } catch(exp) {
            reject(exp);
          }
        });
      }
    }).on('error', function(err) {
      reject(err);
    });
  });
};
