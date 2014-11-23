"use strict";
var assert = require('assert');

var asyncgen = require('asyncgen'); 
var vercast = require('vercast');

describe('DummyKeyValueStore', function(){
    it('should retrieve stored values', asyncgen.async(function*(){
	var kvs = new vercast.DummyKeyValueStore();
	yield* kvs.store('foo', 'bar');
	assert.equal(yield* kvs.fetch('foo'), 'bar');
    }));
});
