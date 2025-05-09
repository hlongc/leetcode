Object.create = function (prototype) {
  function F() {}
  F.prototype = prototype;
  return new F();
};

Function.prototype.bind = function (oThis) {
  const F = this;
  const outerArgs = Array.prototype.slice.call(arguments, 1);

  function bound() {
    const args = outerArgs.concat(Array.prototype.slice.call(arguments));

    if (this instanceof F) {
      return F.apply(this, args);
    } else {
      const effectiveThis =
        oThis === null || oThis === undefined
          ? typeof window !== "undefined"
            ? window
            : globalThis
          : Object(oThis);
      return F.apply(effectiveThis, args);
    }
  }

  if (F.prototype) {
    bound.prototype = Object.create(F.prototype);
  }

  return bound;
};

const obj1 = { name: "obj1" };
const obj2 = { name: "obj2" };
const obj3 = { name: "obj3" };
const obj4 = { name: "obj4" };
const obj5 = { name: "obj5" };
const obj6 = { name: "obj6" };

function test() {
  console.log(this.name);
}

test.bind(obj1).bind(obj2).bind(obj3).bind(obj4).bind(obj5).bind(obj6)();
