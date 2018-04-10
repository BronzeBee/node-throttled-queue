'use strict';

var chai = require('chai');
var assert = chai.assert;
var Promise = require('bluebird');
var ThrottledQueue = require('../index');

describe('ThrottledQueue', function () {

    it('should start empty', function () {
        var queue = new ThrottledQueue(500);
        assert.equal(queue.size(), 0);
    });

    it('should execute all callbacks at given rate', function (done) {
        this.timeout(0);
        var timesCalled = 0;
        var lastCall = 0;
        var num = 20;
        var queue = new ThrottledQueue(250);

        var func = function () {
            ++timesCalled;
            if (lastCall === 0) {
                lastCall = Date.now();
            } else {
                var now = Date.now();
                var delta = now - lastCall;
                lastCall = now;
                assert.isAtLeast(delta, queue.getInterval());
            }
        };

        for (var i = 0; i < num; ++i)
            queue.resolve(func.bind(func));
        queue.resolve(function () {
            assert.equal(timesCalled, num);
            done();
        });
    });

    it('should execute all callbacks waiting for completion', function (done) {
        this.timeout(0);
        var interval = 300;
        var workTime = 200;
        var timesCalled = 0;
        var lastCall = 0;
        var num = 15;
        var queue = new ThrottledQueue(interval, true);

        var func = function (callback) {
            ++timesCalled;
            if (lastCall === 0) {
                lastCall = Date.now();
            } else {
                var now = Date.now();
                var delta = now - lastCall;
                lastCall = now;
                assert.isAtLeast(delta, interval + workTime);
            }
            setTimeout(callback, workTime);
        };

        for (var i = 0; i < num; ++i)
            queue.resolve(func.bind(func));
        queue.resolve(function (callback) {
            callback();
            assert.equal(timesCalled, num);
            done();
        });
    });

    it('should resolve all promises at given rate', function () {
        this.timeout(0);
        var interval = 400;
        var timesCalled = 0;
        var lastCall = 0;
        var num = 10;
        var queue = new ThrottledQueue(interval, false, Promise);
        var promise = Promise.resolve();
        var deltas = [];
        var func = function () {
            return new Promise(function (resolve) {
                ++timesCalled;
                if (lastCall === 0) {
                    lastCall = Date.now();
                } else {
                    var now = Date.now();
                    var delta = now - lastCall;
                    lastCall = now;
                    deltas.push(delta);
                }
                resolve();
            });
        };

        for (var i = 0; i < num; ++i) {
            promise = promise.then(function () {
                return queue.resolve(func);
            });
        }
        return promise.then(function () {
            assert.equal(timesCalled, num);
            for (var i = 0; i < deltas.length; ++i)
                assert.isAtLeast(deltas[i], interval);
        });
    });

    it('should resolve promises waiting for completion', function () {
        this.timeout(0);
        var interval = 200;
        var workTime = 150;
        var timesCalled = 0;
        var lastCall = 0;
        var num = 15;
        var queue = new ThrottledQueue(interval, true, Promise);
        var promise = Promise.resolve();
        var deltas = [];
        var func = function () {
            return new Promise(function (resolve) {
                ++timesCalled;
                if (lastCall === 0) {
                    lastCall = Date.now();
                } else {
                    var now = Date.now();
                    var delta = now - lastCall;
                    lastCall = now;
                    deltas.push(delta);
                }
                setTimeout(resolve, workTime);
            });
        };

        for (var i = 0; i < num; ++i) {
            promise = promise.then(function () {
                return queue.resolve(func);
            });
        }
        return promise.then(function () {
            assert.equal(timesCalled, num);
            for (var i = 0; i < deltas.length; ++i)
                assert.isAtLeast(deltas[i], interval + workTime);
        });
    });

});