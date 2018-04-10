'use strict';

module.exports = ThrottledQueue;

/**
 * @param interval how much time should pass between tasks (in milliseconds).
 * @param awaitCompletion if set to true, this queue will wait until
 *        function execution finishes before scheduling the next one.
 * @param promiseFunc Optional. If this queue should use promises instead of callbacks,
 *        provide Promise constructor function here.
 * @constructor
 */
function ThrottledQueue(interval, awaitCompletion, promiseFunc) {
    this.interval = interval;
    this.awaitCompletion = !!awaitCompletion;
    this.promiseFunc = promiseFunc;
    this.queue = [];
    this.lastAction = 0;
    this.timeout = null;
    // To make sure that no tasks are added to the empty queue while current task is in progress
    this.lock = false;
}

/**
 * Runs the provided task as soon as rate limit allows to.
 * @param action If this instance uses callbacks, function to execute;
 *               no parameters if awaitCompletion is set to false,
 *               otherwise, the callback function that should be called after the task is complete.
 *               If this instance uses promises, function returning a promise to resolve.
 * @returns {*} Promise object if this queue uses promises.
 */
ThrottledQueue.prototype.resolve = function (action) {
    var self = this;
    if (this.promiseFunc) {
        return new this.promiseFunc(function (resolve, reject) {
            self.queue.push({
                action: action,
                resolve: resolve,
                reject: reject
            });
            if (self.timeout == null && !self.lock)
                self._dequeue();
        });
    } else {
        this.queue.push({action: action});
        if (this.timeout == null && !this.lock)
            this._dequeue();
    }
};

/**
 * Return number of remaining items in the queue.
 * @returns {number}
 */
ThrottledQueue.prototype.size = function () {
    return this.queue.length;
};

/**
 * Return scheduling interval for this queue.
 * @returns {*}
 */
ThrottledQueue.prototype.getInterval = function () {
    return this.interval;
};

/**
 * Runs the next task in queue.
 * @private
 */
ThrottledQueue.prototype._dequeue = function () {
    var self = this;

    // setTimeout sometimes triggers earlier
    var now = Date.now();
    if (now - this.lastAction < this.interval) {
        this.timeout = setTimeout(this._dequeue.bind(this), now - this.lastAction);
        return;
    }

    this.lastAction = now;
    if (this.queue.length === 0) {
        this.timeout = null;
        return;
    }

    this.lock = true;
    var next = this.queue.shift();
    if (this.promiseFunc) {
        if (this.awaitCompletion) {
            next.action().then(function (value) {
                self.timeout = setTimeout(self._dequeue.bind(self), self.interval);
                self.lock = false;
                next.resolve(value);
            }, function (reason) {
                self.timeout = setTimeout(self._dequeue.bind(self), self.interval);
                self.lock = false;
                next.reject(reason);
            });
        } else {
            this.timeout = setTimeout(this._dequeue.bind(this), this.interval);
            this.lock = false;
            next.action().then(next.resolve, next.reject);
        }
    } else {
        if (this.awaitCompletion) {
            next.action(function () {
                self.timeout = setTimeout(self._dequeue.bind(self), self.interval);
                self.lock = false;
            });
        } else {
            this.timeout = setTimeout(this._dequeue.bind(this), this.interval);
            this.lock = false;
            next.action();
        }
    }
};