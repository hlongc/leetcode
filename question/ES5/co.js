// const co = require('co')
const fs = require("fs").promises;
const path = require("node:path");

function* read() {
  const a = yield fs.readFile(path.join(__dirname, "name.txt"), "utf-8");
  const b = yield fs.readFile(path.join(__dirname, a), "utf-8");
  return b;
}

function co(it) {
  return new Promise((resolve, reject) => {
    const next = (data) => {
      const { done, value } = it.next(data);
      if (done) {
        resolve(value);
        return;
      }
      Promise.resolve(value).then(next, reject);
    };

    next();
  });
}

co(read()).then(console.log);

console.log(process.platform);

// const it = read()
// const { value, done } = it.next()
// value.then(data => {
//   const { value, done } = it.next(data)
//   value.then(dt => {
//     console.log(dt)
//   })
// })
