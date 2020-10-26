# Promise的实现

#### 规范
- **[Promise A+](https://promisesaplus.com/)**
- **[Promise A+ 译文](https://www.ituring.com.cn/article/66566)**

#### API
- **[Promise API](http://es6.ruanyifeng.com/#docs/promise)**

#### Feature
-	**then**
- **catch**
- **finally**
- **resolve**
- **reject**
-	**all**
-	**race**
- **allSettled**
- **any**
- **try**

#### Test
基于promises-aplus-tests测试Promise的核心逻辑
```Shell
npm run test
```

#### Some Trouble
下面的代码运行在不同的环境
-	chrome
-	node(v12.16.3)
会得到不同的结果
原因是浏览器和node的eventLoop采用不同的实现

```JavaScript
setTimeout(function() {
	console.log('async1');
	throw 'async1 error';
});

setTimeout(function() {
	console.log('async2');
	throw 'async2 error';
});
```

#### TODO
1.	**为catch,finally,resolve,reject,all,race,allSettled,any,try编写测试用例**
2.	**使用TypeScript重构**
