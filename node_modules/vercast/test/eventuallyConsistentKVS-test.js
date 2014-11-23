"use strict";
var assert = require('assert');

var asyncgen = require('asyncgen');
var vercast = require('vercast');

var kvs = new vercast.DummyECKVS();

describe('EventuallyConsistentKVS', function(){
    beforeEach(asyncgen.async(function*() {
	yield* kvs.abolish();
    }));
    
    describe('.newKey(key, value)', function(){
	it('should store a new key/value pair given that the method is called only once for that key', asyncgen.async(function*(){
	    yield* kvs.newKey('foo', 'bar');
	}));
    });
    describe('.retrieve(key)', function(){
	it('should return a previously-assigned value of the key, or undefined the value has not yet been regiested', asyncgen.async(function*(){
	    yield* kvs.newKey('foo', 'bar');
	    var value;
	    while(!value) {
		value = yield* kvs.retrieve('foo');
		yield function(_) { setTimeout(_, 1); };
	    }
	    assert.equal(value, 'bar');
	}));
    });
    describe('.modify(key, value)', function(){
	it('should change the value so that it eventually becomes the given one', asyncgen.async(function*(){
	    yield* kvs.newKey('foo', 'bar');
	    var value;
	    while(!value) {
		value = yield* kvs.retrieve('foo');
		yield function(_) { setTimeout(_, 1); };
	    }
	    yield* kvs.modify('foo', 'baz');
	    while(value === 'bar') {
		value = yield* kvs.retrieve('foo');
		yield function(_) { setTimeout(_, 1); };
	    }
	    assert.equal(value, 'baz');
	}));
    });
});
