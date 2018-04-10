# Throttled Queue

**Simple rate-limited task queue for Node.js.**
## Installation

```
npm install -P git+https://github.com/BronzeBee/node-throttled-queue.git
```
## Usage
Importing the module:
```javascript
// Using ES5 syntax
var ThrottledQueue = require('node-throttled-qeueue');

// Or ES6 syntax
import ThrottledQueue from 'node-throttled-queue';
```
Simple callback queue that runs tasks at fixed rate:
```javascript
/*
 * First parameter is the interval 
 * between tasks in milliseconds;
 * 0.5 seconds in this case.
 */
var queue = new ThrottledQueue(500);

queue.resolve(function() {
    // ...
});
```
Queue that waits unit the task is complete before scheduling the next one:
```javascript
var queue = new ThrottledQueue(1000, true);

/*
 * Note the callback parameter - you should use it
 * in order to indicate that the task is complete.
 */
queue.resolve(function(callback) {
    someAsyncTask(function(args) {
        callback();
        // ...
    });
});
```
To use promises instead of callbacks, provide Promise class constructor as third argument:
```javascript
// Queue that uses ES6 native promises
let queue = new ThrottledQueue(1500, false, Promise);

queue.resolve(() => functionThatReturnsPromise()).then(result => {/* ... */});
```
In order to wait for task completion with promise queue, set the second argument to `true`:
```javascript
let queue = new ThrottledQueue(1500, true, Promise);
```
Note that `queue.resolve(...)` syntax remains the same in this case.

## Tests

Use `npm test`.

## License

This project is licensed under the MIT License - see the [LICENSE.md](LICENSE.md) file for details.

