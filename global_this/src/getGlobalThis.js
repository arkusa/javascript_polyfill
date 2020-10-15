/**
* @file getGlobalThis
* @desc 返回globalThis对象的函数
* @author askura
* @date 2020-10-15
*/

export default (function({
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
