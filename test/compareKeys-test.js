"use strict";
var assert = require('assert');

var asyncgen = require('asyncgen');
var vdb = require('../index.js');
var vercast = require('vercast');

describe('compareKeys(key1, key2)', function(){
    it('should compare strings lexicographically', function(){
	// 'a' < 'b'
	assert.equal(vdb.compareKeys('a', 'b'), -1);
	// 'b' > 'a'
	assert.equal(vdb.compareKeys('b', 'a'), 1);
	// 'foo' === 'foo'
	assert.equal(vdb.compareKeys('a', 'a'), 0);
    });
    it('should compare numbers numerically', function(){
	// 2 < 10
	assert.equal(vdb.compareKeys(2, 10), -1);
	// 10 > 2
	assert.equal(vdb.compareKeys(10, 2), 1);
	// 33 === 33
	assert.equal(vdb.compareKeys(33, 33), 0);
    });
    it('should consider an array as more than anything else', function(){
	// [] > 10
	assert.equal(vdb.compareKeys([], 10), 1);
	// 10 < []
	assert.equal(vdb.compareKeys(10, []), -1);
	// [] > '~'
	assert.equal(vdb.compareKeys([], '~'), 1);
	// '~' < []
	assert.equal(vdb.compareKeys('~', []), -1);
    });
    it('should compare arrays lexicographically', function(){
	assert.equal(vdb.compareKeys(['a', 'a'], ['a', 'b']), -1);
	assert.equal(vdb.compareKeys(['a', 'b'], ['a', 'a']), 1);

	assert.equal(vdb.compareKeys(['b', 'a'], ['a', 'b']), 1);
	assert.equal(vdb.compareKeys(['a', 'b'], ['b', 'a']), -1);

	assert.equal(vdb.compareKeys(['b', 'a'], ['a', 'b', 'c']), 1);
	assert.equal(vdb.compareKeys(['a', 'b', 'c'], ['b', 'a']), -1);
    });
    it('should treat prefix arrays as less than longer arrays', function(){
	assert.equal(vdb.compareKeys([1, 2, 3], [1, 2, 3, 4]), -1);
	assert.equal(vdb.compareKeys([1, 2, 3, 4], [1, 2, 3]), 1);
	assert.equal(vdb.compareKeys([1, 2, 3, 4], [1, 2, 3, 4]), 0);
    });
    it('should recurse to compare nested arrays', function(){
	assert.equal(vdb.compareKeys(['a', 'b', '~'], ['a', 'b', []]), -1);
	assert.equal(vdb.compareKeys(['a', 'b', []], ['a', 'b', '~']), 1);
    });
    it('should be able to compare proxies (objects with get() and set() methods) to real arrays', function(){
	var obj = {};
	obj.array = [1, 2, 3];
	var monitor = new vercast.ObjectMonitor(obj);
	var proxy = monitor.proxy();
	assert.equal(vdb.compareKeys([1, 2, 3], proxy.array), 0);
	assert.equal(vdb.compareKeys(proxy.array, [1, 2, 2]), 1);
	assert.equal(vdb.compareKeys(proxy.array, [1, 2]), 1);
	assert.equal(vdb.compareKeys([1, 2, []], proxy.array), 1);
    });

});
