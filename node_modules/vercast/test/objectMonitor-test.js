"use strict";
var assert = require('assert');

var vercast = require('vercast');

describe('ObjectMonitor', function(){
    describe('.proxy()', function(){
	it('should allow modifying an object through a proxy', function(){
	    var obj = {a:1, b:2};
	    var monitor = new vercast.ObjectMonitor(obj);
	    var proxy = monitor.proxy();
	    assert.equal(proxy.a, 1);
	    proxy.a = 3;
	    assert.equal(obj.a, 3);
	});
	it('should wrap objects (including arrays) with map proxies', function(){
	    var obj = {a:1, b:2};
	    var monitor = new vercast.ObjectMonitor(obj);
	    var proxy = monitor.proxy();
	    proxy.a = [1, 2, 3];
	    assert.throws(function() {
		proxy.a[0] = 4;
	    }, /Can't add property 0, object is not extensible/);
	});
	it('should provide access to child object fields via get/put methods, that update the dirty flag', function(){
	    var obj = {a:1, b:2};
	    var monitor = new vercast.ObjectMonitor(obj);
	    var proxy = monitor.proxy();
	    assert(!monitor.isDirty(), 'should not be dirty');
	    proxy.a = [1, 2, 3];
	    assert(monitor.isDirty(), 'should be dirty after adding updating a to an array');
	    assert(!monitor.isDirty(), 'dirty flag should have been reset');
	    assert.equal(proxy.a.get(1), 2);
	    proxy.a.put(2, 5);
	    assert(monitor.isDirty(), 'should be dirty after updating the value');
	    assert.equal(proxy.a.get(2), 5);
	});
	it('should retain the original object as a simple, JSON-style object', function(){
	    var obj = {a:1, b:2};
	    var monitor = new vercast.ObjectMonitor(obj);
	    var proxy = monitor.proxy();
	    proxy.a = [1, 2, 3];
	    assert.deepEqual(obj, {a:[1, 2, 3], b:2});
	    proxy.a.put(2, 4);
	    assert.deepEqual(obj, {a:[1, 2, 4], b:2});
	});
	it('should use map proxies recursively', function(){
	    var obj = {a:1, b:2};
	    var monitor = new vercast.ObjectMonitor(obj);
	    var proxy = monitor.proxy();
	    proxy.a = [1, 2, 3];
	    proxy.a.put(2, {x:1, y: 2});
	    assert.throws(function() {
		proxy.a.get(2).x = 3;
	    }, /Can't add property x, object is not extensible/);
	    assert.equal(proxy.a.get(2).get('x'), 1);
	    monitor.isDirty(); // reset the dirty flag
	    proxy.a.get(2).put('x', 4);
	    assert(monitor.isDirty(), 'should be dirty now');
	    assert.equal(proxy.a.get(2).get('x'), 4);
	});
	it('should return an unextensible proxy object', function(){
	    var obj = {a:1, b:2};
	    var monitor = new vercast.ObjectMonitor(obj);
	    var proxy = monitor.proxy();
	    assert.throws(function() {
		proxy.c = 4;
	    }, /Can't add property c, object is not extensible/);
	});
	it('should not provide a map proxy for id-like objects', function(){
	    var obj = {a:1, b:2};
	    var monitor = new vercast.ObjectMonitor(obj);
	    var proxy = monitor.proxy();
	    proxy.a = {$:'abc'};
	    assert.equal(proxy.a.$, 'abc');
	});
	it('should not provide a map proxy for id-like nested objects', function(){
	    var obj = {a:1, b:2, c: {$:'abc'}};
	    var monitor = new vercast.ObjectMonitor(obj);
	    var proxy = monitor.proxy();
	    proxy.b = [1, 2, 3];
	    proxy.b.put(1, {$:'efg'});
	    assert.equal(proxy.b.get(1).$, 'efg');
	    assert.equal(proxy.c.$, 'abc');
	});
	describe('._replaceWith(obj)', function(){
	    it('should replace the underlying object with the given one', function(){
		var obj = {a:1, b:2};
		var monitor = new vercast.ObjectMonitor(obj);
		var proxy = monitor.proxy();
		assert.equal(monitor.json(), '{"a":1,"b":2}');
		proxy._replaceWith({x:1, y:2});
		var proxy2 = monitor.proxy();
		assert.equal(proxy2.x, 1);
		assert.equal(monitor.json(), '{"x":1,"y":2}');
	    });
	});
    });
    describe('.isDirty()', function(){
	it('should indicate if a change to the object has been made since the last time it has been called', function(){
	    var obj = {a:1, b:2};
	    var monitor = new vercast.ObjectMonitor(obj);
	    var proxy = monitor.proxy();
	    assert(!monitor.isDirty(), 'monitor should not be dirty yet');
	    proxy.a = 3;
	    assert(monitor.isDirty(), 'monitor should now be dirty');
	    assert(!monitor.isDirty(), 'monitor should not be dirty anymore');
	});
    });
    describe('.hash()', function(){
	it('should return a unique string representing the content of the object', function(){
	    var obj = {a:1, b:2};
	    var monitor = new vercast.ObjectMonitor(obj);
	    var proxy = monitor.proxy();
	    proxy.a = [1, 2, 3];
	    var hash1 = monitor.hash();
	    assert.equal(typeof hash1, 'string');
	    proxy.a.put(0, 4);
	    var hash2 = monitor.hash();
	    assert.notEqual(hash1, hash2);
	    proxy.a.put(0, 1);
	    var hash3 = monitor.hash();
	    assert.equal(hash3, hash1);
	});
	it('should work regardless of dirty testing', function(){
	    var obj = {a:1, b:2};
	    var monitor = new vercast.ObjectMonitor(obj);
	    var proxy = monitor.proxy();
	    proxy.a = [1, 2, 3];
	    var hash1 = monitor.hash();
	    assert.equal(typeof hash1, 'string');
	    proxy.a.put(0, 4);
	    monitor.isDirty();
	    var hash2 = monitor.hash();
	    assert.notEqual(hash1, hash2);
	});
    });
    describe('.seal(obj) [static]', function(){
	it('should make the given object unmodifiable', function(){
	    var obj = {a:1, b:2};
	    vercast.ObjectMonitor.seal(obj);
	    assert.throws(function() {
		obj.a = 3;
	    }, /Cannot assign to read only property/);
	});
	it('should place the object\'s hash as the $ property of the object', function(){
	    var hash1 = new vercast.ObjectMonitor({a:1, b:2}).hash();
	    var obj = {a:1, b:2};
	    vercast.ObjectMonitor.seal(obj);
	    assert.equal(obj.$, hash1);
	});
	it('should return the hash', function(){
	    var obj = {a:1, b:2};
	    var hash1 = vercast.ObjectMonitor.seal(obj);
	    assert.equal(obj.$, hash1);
	});
	it('should allow an object to be sealed multiple times', function(){
	    var obj = {a:1, b:2};
	    var hash1 = vercast.ObjectMonitor.seal(obj);
	    var hash2 = vercast.ObjectMonitor.seal(obj);
	    assert.equal(hash1, hash2);
	});


    });
    describe('.revision()', function(){
	it('should return the object\'s revision number, one that icrements with each change', function(){
	    var obj = {a:1, b:2};
	    var monitor = new vercast.ObjectMonitor(obj);
	    var proxy = monitor.proxy();
	    assert.equal(monitor.revision(), 0);
	    proxy.a = [1, 2, 3];
	    assert.equal(monitor.revision(), 1);
	    proxy.a.put(0, 3);
	    assert.equal(monitor.revision(), 2);
	});
    });
    describe('.json()', function(){
	it('should return a JSON representation of the object', function(){
	    var obj = {a:1, b:2};
	    var monitor = new vercast.ObjectMonitor(obj);
	    var proxy = monitor.proxy();
	    proxy.a = [1, 2, 3];
	    assert.equal(monitor.json(), '{"a":[1,2,3],"b":2}');
	});
    });
    describe('.object()', function(){
	it('should provide an unprovisioned access to the object', function(){
	    var obj = {a:1, b:2};
	    var monitor = new vercast.ObjectMonitor(obj);
	    var obj2 = monitor.object();
	    assert.equal(obj2.a, 1);
	});

    });

});
