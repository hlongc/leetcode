const symbolName = Symbol();
const obj1 = {
  objNumber: new Number(1),
  number: 1,
  objString: new String('ss'),
  string: 'stirng',
  objRegexp: new RegExp('\\w'),
  regexp: /w+/g,
  date: new Date(),
  function: function () { },
  array: [{ a: 1 }, 2],
  [symbolName]: 111
}
obj1.d = obj1;

function deepClone(target, cache = new WeakMap) {
  // 函数和Symbol直接复用之前的
  if (typeof target === 'function' || typeof target === 'symbol') {
    return target
  }
  // 非对象不处理
  if (typeof target !== 'object' || target === null) {
    return target
  }
  if (cache.has(target)) {
    return cache.get(target)
  }
  // 获取构造函数
  const Constructor = target.constructor
  let ret
  switch (Constructor) {
    case Number:
    case String:
    case Boolean:
    case Date:
      ret = new Constructor(target)
      cache.set(target, ret)
      return ret
    case RegExp:
      ret = new RegExp(target.source, target.flags)
      ret.lastIndex = target.lastIndex
      cache.set(target, ret)
      return ret
    // 处理对象
    default:
      ret = Array.isArray(target) ? Array(target.length) : Object.create(Reflect.getPrototypeOf(target))
      cache.set(target, ret) // 克隆前后形成映射关系，可以解决循环引用
      break;
  }
  if (Array.isArray(target)) {
    for (let i = 0; i < target.length; i++) {
      // [1,2,3,,4] 稀疏数组中跳过空元素
      if (i in target) {
        ret[i] = deepClone(target[i], cache)
      }
    }
    return ret
  } else {
    return Reflect.ownKeys(target).reduce((memo, key) => {
      memo[key] = deepClone(target[key], cache)
      return memo
    }, ret)
  }
}

const obj2 = deepClone(obj1)
obj1.number = 2
console.log(obj2)

