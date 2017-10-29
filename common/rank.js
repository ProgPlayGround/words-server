function calculateRank(level) {
  var beg = 1;
  var next = 2;
  var cur = 1;
  while(cur++ < level) {
    var prev = next;
    next += beg;
    beg = prev;
  }
  return {
    'points': 0,
    'level': level,
    'upPoints': beg
  };
}

module.exports = calculateRank;
