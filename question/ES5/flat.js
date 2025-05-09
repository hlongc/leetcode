function flat(list, depth = 1) {
  const ret = [];

  const stack = [...list.map((item) => [item, depth])];

  while (stack.length) {
    const [el, depth] = stack.shift();

    if (Array.isArray(el) && depth > 0) {
      stack.unshift(...el.map((i) => [i, depth - 1]));
    } else {
      ret.push(el);
    }
  }

  return ret;
}

const arr = [[1], [[[8, 9, 2, "xixi"]]], 3, [4, [5, 6, 7]]];

console.log(flat(arr, 5));
