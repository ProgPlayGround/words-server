
module.exports = {
  range: function(start, end) {
    return start + Math.floor(Math.random() * end);
  },
  bool: function() {
    return Math.random() >= 0.5;
  }
}
