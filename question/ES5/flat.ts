function flat(arr: any[], depth = 1) {
  const result: any[] = [];
  const queue: [any, number][] = arr.map((item) => [item, depth]);

  while (queue.length) {
    const [el, dep] = queue.shift()!;
    if (Array.isArray(el) && dep > 0) {
      queue.unshift(...(el.map((item) => [item, dep - 1]) as any));
    } else {
      result.push(el);
    }
  }

  return result;
}

const arr = [[1], [[[8, 9, 2, "xixi"]]], 3, [4, [5, 6, 7]]];

console.log(flat(arr, 5));
