/**
* @file getGlobalThis
* @desc 返回globalThis对象的函数
* @author askura
* @date 2020-10-15
*/

var getGlobalThis = (function({
  self,
  global,
  window,
  globalThis,
}) {
  return function getGlobalThis() {
    if (typeof globalThis !== 'undefined') return globalThis;
    if (typeof self !== 'undefined') return self;
    if (typeof window !== 'undefined') return window;
    if (typeof global !== 'undefined') return global;

    throw new Error('Unable to locate global `this`');
  }
}({
  self,
  global,
  window,
  globalThis,
}));

/**
* @file globalThis
* @desc 通过getter函数的 this 获得 globalThis
* @uri https://github.com/ungap/global-this/blob/master/esm/index.js
* @author askura
* @date 2020-10-15
*/

(function(Object) {
  if (typeof globalThis !== 'object') {
    if (this) this.globalThis = this;
    else {
      Object.defineProperty(Object.prototype, '__hack__', {
        get() {
          return this;
        },
        configurable: true,
      });
      __hack__.globalThis = __hack__;
      delete Object.prototype.__hack__;
    }
  }
}(Object));

var globalThis$1 = globalThis;

export { getGlobalThis, globalThis$1 as globalThis };
