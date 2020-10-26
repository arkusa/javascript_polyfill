/* eslint-disable */
const PromisePolyfill = (function () {
  /* promise 的 3种状态 */
  const PENDDING = 'pendding';
  const REJECTED = 'rejected';
  const FULFILLED = 'fulfilled';

  /* promise实例上暴露出的属性 */
  const PROMISEVALUE = 'promise_value';
  const PROMISESTATUS = 'promise_status';

  /* @desc 是不是函数 */
  function isFunction(func) {
    return typeof func === 'function';
  }

  /* @desc 是不是Promise */
  function isPromise(x) {
    return x instanceof Promise || x instanceof MyPromise; // eslint-disable-line
  }

  /* @desc 是不是thenable */
  function isThenable(x) {
    return (
      (typeof x === 'object' || typeof x === 'function') && 'then' in x // 这里要使用in运算符 不用使用x.then
    );
  }

  /* @desc 偏函数 */
  function partial(func, ...argvs) {
    return function (...remainArgvs) { // eslint-disable-line
      func(...argvs, ...remainArgvs);
    };
  }

  /* @desc 模拟micro task */
  function applyAsync(callback) {
    setTimeout(() => callback());
  }

  /* @desc 执行回调函数队列 */
  function applyCallbacks(callbacks, x) {
    callbacks
      .map(callback => partial(callback, x)) // eslint-disable-line
      .forEach((callback) => applyAsync(callback)); // elsint-disable-line
  }

  /* @desc 一个互斥函数, 用来处理resolve和reject互斥 */
  function applyOnce(...funcs) {
    let called = false;

    return funcs.map((func) => (...argvs) => {
      if (called) return;
      called = true;

      func(...argvs);
    });
  }

  /* @desc 封装then传入的回调函数 */
  function callbackFactory(callback, resolve, reject) {
    return function (value) {
      try {
        const ret = callback(value);
        resolve(ret);
      } catch (reason) {
        reject(reason);
      }
    };
  }

  class CallbackQueue extends Array {
    constructor(context, status) {
      super();
      this.context = context;
      this.status = status;
    }

    // override
    forEach(func) {
      let callback = this.shift();
      while (callback) {
        func(callback);
        callback = this.shift();
      }
    }

    // override
    push(callback) {
      // 这里判断状态
      if (this.status === this.context[PROMISESTATUS]) {
        applyAsync(partial(callback, this.context[PROMISEVALUE]));
      } else {
        super.push(callback);
      }
    }
  }

  class FulfilledCallbackQueue extends CallbackQueue {
    constructor(context) {
      super(context, FULFILLED);
    }
  }

  class RejectedCallbackQueue extends CallbackQueue {
    constructor(context) {
      super(context, REJECTED);
    }
  }

  function rejectPromise(context, reason) {
    if (context[PROMISESTATUS] !== PENDDING) return; // eslint-disable-line

    context[PROMISEVALUE] = reason; // eslint-disable-line
    context[PROMISESTATUS] = REJECTED; // eslint-disable-line

    applyCallbacks(context.rejectedCallbacks, reason);
  }

  function resolvePromise(context, x) {
    if (context[PROMISESTATUS] !== PENDDING) return;

    try {
      if (x === context) {
        throw new TypeError('xxx');
      }

      if (isPromise(x)) {
        x.then(
          (res) => resolvePromise(context, res),
          (reason) => rejectPromise(context, reason),
        );

        return;
      }

      if (isThenable(x)) {
        const { then } = x;

        if (isFunction(then)) {
          const [resolve, reject] = applyOnce(
            partial(resolvePromise, context),
            partial(rejectPromise, context),
          );

          try {
            then.call(x, resolve, reject);
          } catch (reason) {
            reject(reason);
          }

          return;
        }
      }
    } catch (reason) {
      rejectPromise(context, reason);
    }

    context[PROMISEVALUE] = x; // eslint-disable-line
    context[PROMISESTATUS] = FULFILLED; // eslint-diable-line

    applyCallbacks(context.fulfilledCallbacks, x);
  }

  class MyPromise {
    constructor(func) {
      this[PROMISEVALUE] = undefined;
      this[PROMISESTATUS] = PENDDING;
      this.rejectedCallbacks = new RejectedCallbackQueue(this);
      this.fulfilledCallbacks = new FulfilledCallbackQueue(this);

      const [resolve, reject] = applyOnce(
        partial(resolvePromise, this),
        partial(rejectPromise, this),
      );

      try {
        func(resolve, reject);
      } catch (reason) {
        reject(reason);
      }
    }

    then(fulfilledCallback, rejectedCallback) {
      let onFulfilled = isFunction(fulfilledCallback)
        ? fulfilledCallback
        : (res) => res;

      let onRejected = isFunction(rejectedCallback)
        ? rejectedCallback
        : (reason) => {
          throw reason;
        };

      let resolve;
      let reject;
      const retPromise = new MyPromise((rs, re) => {
        resolve = rs;
        reject = re;
      });

      onRejected = callbackFactory(onRejected, resolve, reject);
      onFulfilled = callbackFactory(onFulfilled, resolve, reject);

      this.rejectedCallbacks.push(onRejected);
      this.fulfilledCallbacks.push(onFulfilled);

      return retPromise;
    }
  }

  return MyPromise;
}());

module.exports = PromisePolyfill;
