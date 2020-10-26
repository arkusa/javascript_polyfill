const MyPromise = require('./core');

function mixin(target, prop, value) {
  Object.assing(target, { [prop]: value });
}

// catch方法
function catchMethod(rejectedCallback) {
  return this.then(null, rejectedCallback);
}

// finally方法
function finallyMethod(callback) {
  return new MyPromise((resolve, reject) => {
    this.then(
      (res) => {
        callback();
        return res;
      },
      (reason) => {
        callback();
        throw reason;
      },
    ).then(
      (res) => resolve(res),
      (reason) => reject(reason),
    );
  });
}

// all方法
function allMethod(promises) {
  const promisesCount = promises.length;
  const promisesValues = [];
  let fulfilledPromiseCount = 0;

  return new MyPromise((resolve, reject) => {
    promises.forEach((promise, index) => {
      promise.then((res) => {
        fulfilledPromiseCount += 1;
        promisesValues[index] = res;

        if (promisesCount === fulfilledPromiseCount) resolve(promisesValues);
      }, reject);
    });
  });
}

// race方法
function raceMethod(promises) {
  return new MyPromise((resolve, reject) => {
    promises.forEach((promise) => promise.then(resolve, reject));
  });
}

// allSettled方法
function allSettledMethod(promises) {
  const promisesValues = [];
  const promisesCount = promises.length;
  let notPenddingPromiseCount = 0;

  return new MyPromise((resolve) => {
    promises.forEach((promise) => {
      promise
        .then(
          (value) => ({ status: 'fulfilled', value }),
          (reason) => ({ status: 'rejected', reason }),
        )
        .then((value) => {
          notPenddingPromiseCount += 1;
          promisesValues.push(value);

          if (notPenddingPromiseCount === promisesCount) resolve(promisesValues);
        });
    });
  });
}

// any反法
function anyMethod(promises) {
  const rejectedPromisesValues = [];
  const promisesCount = promises.length;
  let rejectedPromiseCount = 0;

  return new MyPromise((resolve, reject) => {
    promises.forEach((promise) => {
      promise.then(
        (res) => resolve(res),
        (reason) => {
          rejectedPromisesValues.push(reason);
          rejectedPromiseCount += 1;

          if (rejectedPromiseCount === promisesCount) reject(reason);
        },
      );
    });
  });
}

// resolve方法
function resolveMethod(value) {
  return new MyPromise((resolve) => resolve(value));
}

// reject方法
function rejectMethod(value) {
  return new MyPromise((resolve, reject) => reject(value));
}

// try方法
function tryMethod(func) {
  return new MyPromise((resolve) => resolve(func()));
}

mixin(MyPromise.prototype, 'catch', catchMethod);
mixin(MyPromise.prototype, 'finally', finallyMethod);
mixin(MyPromise, 'resolve', resolveMethod);
mixin(MyPromise, 'reject', rejectMethod);
mixin(MyPromise, 'try', tryMethod);
mixin(MyPromise, 'all', allMethod);
mixin(MyPromise, 'race', raceMethod);
mixin(MyPromise, 'allSettled', allSettledMethod);
mixin(MyPromise, 'any', anyMethod);

module.exports = MyPromise;
