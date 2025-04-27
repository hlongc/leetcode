Number.prototype.add = function (num) {
  return this + num;
};

Number.prototype.minus = function (num) {
  return this - num;
};

console.log((5).add(3).minus(2));
