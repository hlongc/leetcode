const PENDING = "PENDING";
const FULFILLED = "FULFILLED";
const REJECTED = "REJECTED";

function resolvePromise(promise2, x, resolve, reject) {
  if (promise2 === x) {
    throw new TypeError("循环引用了");
  }

  if ((typeof x === "object" && x !== null) || typeof x === "function") {
    let called = false;
    try {
      const then = x.then;
      if (typeof then === "function") {
        then.call(
          x,
          (y) => {
            if (called) return;
            called = true;
            // 递归解析结果
            resolvePromise(promise2, y, resolve, reject);
          },
          (r) => {
            if (called) return;
            called = true;
            reject(r);
          }
        );
      } else {
        resolve(x);
      }
    } catch (e) {
      if (called) return;
      called = true;
      reject(e);
    }
  } else {
    resolve(x);
  }
}

class Promise {
  constructor(executor) {
    this.status = PENDING;
    this.value = undefined;
    this.reason = undefined;
    this.onResolveCallbacks = [];
    this.onRejectCallbacks = [];

    const resolve = (value) => {
      if (value instanceof Promise) {
        value.then(resolve, reject);
        return;
      }

      if (this.status === PENDING) {
        this.value = value;
        this.status = FULFILLED;
        this.onResolveCallbacks.forEach((fn) => fn());
      }
    };

    const reject = (reason) => {
      if (this.status === PENDING) {
        this.reason = reason;
        this.status = REJECTED;
        this.onRejectCallbacks.forEach((fn) => fn());
      }
    };

    try {
      executor(resolve, reject);
    } catch (e) {
      reject(e);
    }
  }

  static deferred() {
    let dfd = {};

    dfd.promise = new Promise((resolve, reject) => {
      dfd.resolve = resolve;
      dfd.reject = reject;
    });

    return dfd;
  }

  static resolve(val) {
    return new Promise((resolve) => {
      resolve(val);
    });
  }

  static reject(reason) {
    return new Promise((_, reject) => {
      reject(reason);
    });
  }

  static race(list) {
    return new Promise((resolve, reject) => {
      list.forEach((val) => {
        Promise.resolve(val).then(resolve, reject);
      });
    });
  }

  static all(list) {
    const data = [];
    let count = 0;
    // 处理稀疏数组长度问题
    for (let i = 0; i < list.length; i++) {
      if (i in list) {
        count++;
      }
    }

    return new Promise((resolve, reject) => {
      for (let index = 0; index < list.length; index++) {
        if (index in list) {
          const val = list[index];
          Promise.resolve(val).then((res) => {
            data[index] = res;
            if (--count === 0) {
              resolve(data);
            }
          }, reject);
        }
      }
    });
  }

  static allSettled(list) {
    const data = [];
    let count = list.length;

    return new Promise((resolve) => {
      for (let index = 0; index < list.length; index++) {
        if (index in list) {
          const val = list[index];
          Promise.resolve(val).then(
            (res) => {
              data[index] = { status: "fulfilled", value: res };
              if (--count === 0) {
                resolve(data);
              }
            },
            (reason) => {
              data[index] = { status: "rejected", reason };
              if (--count === 0) {
                resolve(data);
              }
            }
          );
        } else {
          data[index] = { status: "fulfilled", value: undefined };
          if (--count === 0) {
            resolve(data);
          }
        }
      }
    });
  }

  then(onFulfilled, onRejected) {
    onFulfilled = typeof onFulfilled === "function" ? onFulfilled : (v) => v;
    onRejected =
      typeof onRejected === "function"
        ? onRejected
        : (r) => {
            throw r;
          };
    const promise2 = new Promise((resolve, reject) => {
      if (this.status === FULFILLED) {
        setTimeout(() => {
          try {
            const x = onFulfilled(this.value);
            resolvePromise(promise2, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        });
      }

      if (this.status === REJECTED) {
        setTimeout(() => {
          try {
            const x = onRejected(this.reason);
            resolvePromise(promise2, x, resolve, reject);
          } catch (e) {
            reject(e);
          }
        });
      }

      if (this.status === PENDING) {
        this.onResolveCallbacks.push(() => {
          setTimeout(() => {
            try {
              const x = onFulfilled(this.value);
              resolvePromise(promise2, x, resolve, reject);
            } catch (e) {
              reject(e);
            }
          });
        });

        this.onRejectCallbacks.push(() => {
          setTimeout(() => {
            try {
              const x = onRejected(this.reason);
              resolvePromise(promise2, x, resolve, reject);
            } catch (e) {
              reject(e);
            }
          });
        });
      }
    });

    return promise2;
  }

  catch(onRejected) {
    return this.then(null, onRejected);
  }
}

module.exports = Promise;

Promise.allSettled([, , Promise.reject(1), , Promise.reject(2)])
  .then(console.log)
  .catch((err) => {
    console.log("捕获异常", err);
  });
