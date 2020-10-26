const MyPromise = (function () {
  const PENDDING = 'pendding';
  const REJECTED = 'rejected';
  const FULFILLED = 'fulfilled';

  const PROMISESTATUS = 'promise_status';
  const PROMISEVALUE = 'promise_value';

  /* @desc 判断thenable对象/函数 */
  function isThenable(object) {
    return (
      object
      && (typeof object === 'object' || typeof object === 'function')
      && 'then' in object
    );
  }

  /* @desc 判断promise */
  function isPromise(object) {
    return (
      (object instanceof MyPromise || object instanceof Promise)
      && 'then' in object
    );
  }

  /* @desc 判断函数 */
  function isFunction(func) {
    return typeof func === 'function';
  }

  /* @desc 偏函数,主要用途是暴露给使用者的resolve/reject方法预先添加上下文 */
  function partial(func, ...argvs) {
    return function partialCore(...remainArgvs) {
      func(...[...argvs, ...remainArgvs]);
    };
  }

  /* @desc 模拟microTask */
  function asyncCall(func, value) {
    setTimeout(() => func(value), 0);
  }

  /* @desc 执行fulfilled和rejected的回调函数 */
  function applyCallbacks(callbacks, value) {
    callbacks.forEach((callback) => asyncCall(callback, value));
  }

  /* @desc 解决互斥函数(resolve和reject) */
  function applyOnce(...funcs) {
    let calledLock = false;

    return funcs.map((func) => (...argvs) => {
      if (calledLock) return;
      calledLock = true;

      func(...argvs);
    });
  }

  /* @desc 封装then传入的回调函数, 为了resolve/reject then中实例化的promise */
  function callbackFactory(callback, resolve, reject) {
    return function callbackCore(value) {
      try {
        const nextMyPromiseValue = callback(value);
        resolve(nextMyPromiseValue);
      } catch (reason) {
        reject(reason);
      }
    };
  }

  /* @desc 拒绝MyPromise的过程 */
  function rejectMyPromise(context, reason) {
    const contextCopy = context;
    if (context[PROMISESTATUS] !== PENDDING) return;

    contextCopy[PROMISEVALUE] = reason;
    contextCopy[PROMISESTATUS] = REJECTED;

    const { rejectedCallbacks } = context;

    // 下面的处理是在chrome中如果没有使用catch/then的第二个参数对异常捕获
    // 会将异常抛出到控制台
    // 因为是异步抛出的错误,所以并不会影响程序执行
    // rejectedCallbacks = rejectedCallbacks.length > 0
    // ? rejectedCallbacks
    // : [reason => { throw new Error(reason) }];
    // 上面的code被注释掉了
    // 这个code在node环境下有异常,
    // 这与node的eventLoop机制有关
    // 上述代码中是用timeout模拟的microTask
    // 而timer只是node eventLoop中的一个阶段其中断了当前的eventLoop
    // eg: https://github.com/thaloy/JSPolyfill/tree/master/Promise#some-trouble
    applyCallbacks(rejectedCallbacks, reason);
  }

  /* @desc 解决promise的核心方法 */
  function resolveMyPromise(context, x) {
    const contextCopy = context;
    if (context[PROMISESTATUS] !== PENDDING) return;

    try {
      if (context === x) {
        throw new TypeError('Chaining cycle detected for promise #<MyPromise>');
      }

      // 这里一定要先判断promise后判断thenable
      // 与isPromise和isThenable的实现有关
      if (isPromise(x)) {
        x.then(
          (res) => resolveMyPromise(context, res),
          (reason) => rejectMyPromise(context, reason),
        );

        return;
      }

      if (isThenable(x)) {
        const { then } = x; // 这里A+规范要求,防止一元运算符.有额外副作用(Proxy, definePrototype)

        if (isFunction(then)) {
          // 对thenable对象&&then是函数的处理与对实例化MyPromise时传入的
          // 回调函数的处理是一致的
          // 除了需要绑定上下文外
          const [resolve, reject] = applyOnce(
            partial(resolveMyPromise, context),
            partial(rejectMyPromise, context),
          );

          /*
           * @desc 这里的异常需要单独处理,因为这个时候对异常的处理需要和resolve互斥
           * @example
           * new Promise(resolve => {
           *  resolve(2);
           *  throw new Error('some error');
           * });
           */

          // 这里需要异步
          // asyncCall(() => {
          try {
            then.call(x, resolve, reject);
          } catch (reason) {
            reject(reason);
          }
          // });

          return;
        }
      }

      contextCopy[PROMISESTATUS] = FULFILLED;
      contextCopy[PROMISEVALUE] = x;
      applyCallbacks(context.fulfilledCallbacks, x);
    } catch (reason) {
      rejectMyPromise(context, reason);
    }
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
      if (this.status === this.context[PROMISESTATUS]) {
        asyncCall(callback, this.context[PROMISEVALUE]);
      } else {
        super.push(callback);
      }
    }
  }

  class RejectedCallbackQueue extends CallbackQueue {
    constructor(context) {
      super(context, REJECTED);
    }
  }

  class FulfilledCallbackQueue extends CallbackQueue {
    constructor(context) {
      super(context, FULFILLED);
    }
  }

  class MyPromise { // eslint-disable-line
    constructor(func) {
      this[PROMISESTATUS] = PENDDING;
      this[PROMISEVALUE] = undefined;
      this.rejectedCallbacks = new RejectedCallbackQueue(this);
      this.fulfilledCallbacks = new FulfilledCallbackQueue(this);

      // 这里的处理过程参照对thenable对处理
      const [resolve, reject] = applyOnce(
        partial(resolveMyPromise, this),
        partial(rejectMyPromise, this),
      );

      try {
        func(resolve, reject);
      } catch (reason) {
        reject(reason);
      }
    }

    then(fulfilledCallback, rejectedCallback) {
      const onFulfilled = isFunction(fulfilledCallback)
        ? fulfilledCallback
        : (res) => res;

      const onRejected = isFunction(rejectedCallback)
        ? rejectedCallback
        : (reason) => {
          throw reason;
        };

      let resolve;
      let reject;
      const promise = new MyPromise((rs, re) => {
        resolve = rs;
        reject = re;
      });

      this.fulfilledCallbacks.push(
        callbackFactory(onFulfilled, resolve, reject),
      );
      this.rejectedCallbacks.push(
        callbackFactory(onRejected, resolve, reject),
      );

      return promise;
    }
  }

  return MyPromise;
}());

module.exports = MyPromise;
