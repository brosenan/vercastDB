"use strict";
var assert = require('assert');

var vercast = require('vercast');
var asyncgen = require('asyncgen');

var factory = new vercast.SequenceStoreFactory(new vercast.DummyKeyValueStore());

describe('SequenceStoreFactory', function(){
    describe('.createSequenceStore()', function(){
	it('should return a new sequence store', function(){
	    var seqStore = factory.createSequenceStore();
	    assert.equal(typeof seqStore, 'object');
	});
	describe('.append(obj)', function(){
	    it('should append an object to a sequence', asyncgen.async(function*(){
		var seqStore = factory.createSequenceStore();
		yield* seqStore.append({a:1});
		yield* seqStore.append({a:2});
	    }));
	    it('should append an entire sequence if given its hash', asyncgen.async(function*(){
		var seqStore1 = factory.createSequenceStore();
		yield* seqStore1.append({a:1});
		yield* seqStore1.append({a:2});

		var seqStore2 = factory.createSequenceStore();
		yield* seqStore2.append(yield* seqStore1.hash());
		yield* seqStore2.append({a:3});
		
		assert.deepEqual(yield* seqStore2.shift(), {a:1});
		assert.deepEqual(yield* seqStore2.shift(), {a:2});
		assert.deepEqual(yield* seqStore2.shift(), {a:3});
	    }));
	    it('should append a sequence consisting of a single object when given its hash', asyncgen.async(function*(){
		var seqStore1 = factory.createSequenceStore();
		yield* seqStore1.append({a:2});

		var seqStore2 = factory.createSequenceStore();
		yield* seqStore2.append({a:1});
		yield* seqStore2.append(yield* seqStore1.hash());
		yield* seqStore2.append({a:3});
		
		assert.deepEqual(yield* seqStore2.shift(), {a:1});
		assert.deepEqual(yield* seqStore2.shift(), {a:2});
		assert.deepEqual(yield* seqStore2.shift(), {a:3});
	    }));

	});
	describe('.isEmpty()', function(){
	    it('should indicate if the sequence is empty', asyncgen.async(function*(){
		var seqStore = factory.createSequenceStore();
		assert(seqStore.isEmpty(), 'should be empty');
		yield* seqStore.append({a:1});
		assert(!seqStore.isEmpty(), 'should not be empty anymore');
	    }));
	});
	describe('.shift()', function(){
	    it('should remove the first element from the sequence and return it', asyncgen.async(function*(){
		var seqStore = factory.createSequenceStore();
		yield* seqStore.append({a:1});
		yield* seqStore.append({a:2});
		assert.deepEqual(yield* seqStore.shift(), {a:1});
		assert.deepEqual(yield* seqStore.shift(), {a:2});
		assert(seqStore.isEmpty());
	    }));
	});
	describe('.pop()', function(){
	    it('should remove the last element from the sequence and return it', asyncgen.async(function*(){
		var seqStore = factory.createSequenceStore();
		yield* seqStore.append({a:1});
		yield* seqStore.append({a:2});
		assert.deepEqual(yield* seqStore.pop(), {a:2});
		assert.deepEqual(yield* seqStore.pop(), {a:1});
		assert(seqStore.isEmpty());
	    }));
	});
	describe('.hash()', function(){
	    it('should return an empty string if the sequence is empty', asyncgen.async(function*(){
		var seqStore = factory.createSequenceStore();
		assert.equal(yield* seqStore.hash(), '');
	    }));
	    it('should return the object hash, assuming only one object in the sequence', asyncgen.async(function*(){
		var seqStore = factory.createSequenceStore();
		yield* seqStore.append({a:1});
		assert.equal(yield* seqStore.hash(), vercast.ObjectMonitor.seal({a:1}));
	    }));
	    it('should return a hash unique to the sequence for sequence size larger than 1', asyncgen.async(function*(){
		var seqStore1 = factory.createSequenceStore();
		yield* seqStore1.append({a:1});
		yield* seqStore1.append({a:2});
		yield* seqStore1.append({a:3});
		var seqStore2 = factory.createSequenceStore();
		yield* seqStore2.append({a:1});
		yield* seqStore2.append({a:2});
		yield* seqStore2.append({a:3});
		assert.equal(yield* seqStore1.hash(), yield* seqStore2.hash());
		var seqStore3 = factory.createSequenceStore();
		yield* seqStore3.append({a:1});
		yield* seqStore3.append({a:2});
		assert.notEqual(yield* seqStore3.hash(), yield* seqStore2.hash());
	    }));
	    it('should provide the same hash if the only element in a sequence is a hash of another sequence', asyncgen.async(function*(){
		var seqStore1 = factory.createSequenceStore();
		yield* seqStore1.append({a:1});
		yield* seqStore1.append({a:2});
		yield* seqStore1.append({a:3});
		
		var seqStore2 = factory.createSequenceStore();
		yield* seqStore2.append(yield* seqStore1.hash());
		
		assert.equal(yield* seqStore1.hash(), yield* seqStore2.hash());
	    }));
	});
    });
});
