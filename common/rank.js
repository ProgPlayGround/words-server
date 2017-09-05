function calculate(points) {
  var beg = 1;
  var next = 2;
  var level = 0;
  while(points - beg >= 0) {
    points -= beg;
    ++level;
    var prev = next;
    next += beg;
    beg = prev;
  }
  return {
    level: level,
    progress: points / beg
  };
};

module.exports = function(points) {
  return calculate(points);
};
