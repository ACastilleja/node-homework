# Node.js Fundamentals

## What is Node.js?
Node.js is runtime environment that allows us to run JavaScript outside of a web browser. 

## How does Node.js differ from running JavaScript in the browser?
Javascrippt in the browser is designed for client side user interactions, user interface while Node.js is server-side environment that interacts directly with an operating system and hardware. 

## What is the V8 engine, and how does Node use it?
The V8 engine is a high performance JavaScript engine that powers Google Chrome. It is used by Node as the core execution powerhouse that allow javascript to run anywhere, laptop, terminal, local server, or cloud. 

## What are some key use cases for Node.js?
You can use it in real-time chat, single page application serving, microservices architecture. 

## Explain the difference between CommonJS and ES Modules. Give a code example of each.

**CommonJS (default in Node.js):**
```js
//Common JS uses is older and uses module.exports to share and require() to import
//from math.js
const add =(a,b) =>a + b;
module.exports = {add};
//app.js
conts{add}=require('./math');
console.log(add(2,3));
```

**ES Modules (supported in modern Node.js):**
```js
// ES Module is currently used and uses export to share and import to use code.
//maths.js
export const add = (a,b)=> a + b;
//app.js
import {add}from './math.js';
console.log(add(2,3));
``` 