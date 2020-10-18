/**
* @file bind
* @desc bind_polyfill
* @author askura
* @date 2020-10-19
*/

/* eslint-disable */
(function (Function) {

  function bind(context, ...argvs) {
    const func = this; 

    function acceptNextArgvs(...nextArgvs) {
      context = this instanceof F ? this : context;

      return func.call(context, ...argvs, ...nextArgvs);
    }

    function F() {}

    F.prototype = this.prototype;
    acceptNextArgvs.prototype = new F();
    acceptNextArgvs.prototype.constructor = func;
    acceptNextArgvs.toString = () => func.toString();

    return acceptNextArgvs;
  }

  if (typeof Function.prototype.bind !== 'function') Function.prototype.bind = bind;

}(Function));
