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

export default globalThis;
