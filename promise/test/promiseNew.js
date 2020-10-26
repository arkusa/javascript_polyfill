const MyPromise = require('../src/new.js');

const deferred = () => {
  const dfd = {};
  dfd.promise = new MyPromise((resolve, reject) => {
    dfd.resolve = resolve;
    dfd.reject = reject;
  });

  return dfd;
};

MyPromise.deferred = deferred;

const dfd = MyPromise.deferred();
dfd.promise.then((res) => console.log(res, 'succ'), (reason) => console.log(reason, 'fail'));
dfd.resolve({
  then(resolve, reject) {
    resolve(1);
  },
});
dfd.reject(2);

module.exports = MyPromise;
