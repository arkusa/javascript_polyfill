const MyPromise = require('../src/core.js');

const deferred = () => {
  const dfd = {};
  dfd.promise = new MyPromise((resolve, reject) => {
    dfd.resolve = resolve;
    dfd.reject = reject;
  });

  return dfd;
};

MyPromise.deferred = deferred;
module.exports = MyPromise;
