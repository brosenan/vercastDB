"use strict";
var assert = require('assert');

var asyncgen = require('asyncgen');
var vercast = require('vercast');

module.exports = function(atomicKV) {
    describe('as AtomicKeyValue', function(){
	beforeEach(asyncgen.async(function*() {
	    yield* atomicKV.clear();
	}));
	describe('.newKey(key, val)', function(){
	    it('should store a new key/value pair, given that key does not already exist', asyncgen.async(function*(){
		yield* atomicKV.newKey('foo', 'bar');
		var value = yield* atomicKV.retrieve('foo');
		assert.equal(value, 'bar');
	    }));
	    it('should emit an error when the key already exists', asyncgen.async(function*(){
		try {
		    yield* atomicKV.newKey('foo', 'bar');
		    yield* atomicKV.newKey('foo', 'bar');
		    assert(false, 'An error should be emitted');
		} catch(err) {
		    assert.equal(err.message, 'Key foo already exists');
		}
	    }));
	});
	describe('.retrieve(key))', function(){
	    it('should emit an error if the value does not exist', asyncgen.async(function*(){
		try {
		    var value = yield* atomicKV.retrieve('foo');
		    assert(false, 'the value is not supposed to be found');
		} catch(err) {
		    assert.equal(err.message, 'Key foo was not found');
		}
	    }));
	});
	describe('.modify(key, oldVal, newVal)', function(){
	    it('should change the value under key to newVal, given that the previous value was oldVal', asyncgen.async(function*(){
		yield* atomicKV.newKey('foo', 'bar');
		var valAfterMod = yield* atomicKV.modify('foo', 'bar', 'baz');
		assert.equal(valAfterMod, 'baz');
		var val = yield* atomicKV.retrieve('foo');
		assert.equal(val, 'baz');
	    }));
	    it('should not change the value under key if the current value does not equal oldVal', asyncgen.async(function*(){
		yield* atomicKV.newKey('foo', 'bar');
		var valAfterMod = yield* atomicKV.modify('foo', 'baz', 'bat');
		assert.equal(valAfterMod, 'bar'); // The value before the change
		var val = yield* atomicKV.retrieve('foo');
		assert.equal(val, 'bar');
	    }));
	});
    });
};