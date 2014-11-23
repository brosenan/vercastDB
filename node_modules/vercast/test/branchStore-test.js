"use strict";
var assert = require('assert');

var asyncgen = require('asyncgen');
var vercast = require('vercast');

var seqFactory = new vercast.SequenceStoreFactory(new vercast.DummyKeyValueStore());
var ostore = new vercast.DummyObjectStore(new vercast.ObjectDispatcher(vercast.examples), seqFactory);
ostore = new vercast.RootStore(ostore);
var graphDB = new vercast.DummyGraphDB();
var versionGraph = new vercast.SimpleVersionGraph(graphDB);
ostore = new vercast.MergingObjectStore(ostore, versionGraph, seqFactory);

var atomicKVS = new vercast.DummyAtomicKVS();
var ecKVS = new vercast.DummyECKVS();
var branchStore = new vercast.BranchStore(ostore, atomicKVS, ecKVS);

describe('BranchStore', function(){
    beforeEach(asyncgen.async(function*() {
	// Wait for all pending modifications to take place
	yield function(_) { setTimeout(_, 5); };
	yield* ecKVS.abolish();
	yield* atomicKVS.clear();
    }));
    describe('.init(type, args)', function(){
	it('should create a new object version, and return its ID', asyncgen.async(function*(){
	    var v = yield* branchStore.init('atom', {value: 'foo'});
	    assert.equal((yield* ostore.trans(v, {_type: 'get'})).r, 'foo');
	}));
    });
    describe('.trans(v, p, u) -> {v,r}', function(){
	it('should transform an object version according to the given patch', asyncgen.async(function*(){
	    var v = yield* branchStore.init('atom', {value: 'foo'});
	    v = (yield* branchStore.trans(v, {_type: 'set', from: 'foo', to: 'bar'})).v;
	    assert.equal((yield* ostore.trans(v, {_type: 'get'})).r, 'bar');
	}));
    });
    describe('.fork(b, v)', function(){
	it('should create a new branch, starting at the given version ID', asyncgen.async(function*(){
	    var v = yield* branchStore.init('atom', {value: 'foo'});
	    yield* branchStore.fork('br1', v);
	}));
    });
    describe('.head(b)', function(){
	it('should return the last known head of a branch (can be somewhat stale)', asyncgen.async(function*(){
	    var v1 = yield* branchStore.init('atom', {value: 'foo'});
	    yield* branchStore.fork('br1', v1);
	    var v2 = yield* branchStore.head('br1');
	    assert.equal(typeof v2.$, 'string');
	}));
	it('should fail gracefully if the branch has not been initialized', asyncgen.async(function*(){
	    try {
		yield* branchStore.head('branchThatDoesNotExist', 5); // Only try 5 times
		assert(false, 'Previous statement should fail');
	    } catch(e) {
		assert.equal(e.message, 'Exhausted the number of attempts trying to fetch the head of branch branchThatDoesNotExist');
	    }
	}));
    });
    describe('.push(b, v, atomic=false)', function(){
	it('should merge the changes made in v to branch b', asyncgen.async(function*(){
	    var v1 = yield* branchStore.init('array', {elementType: 'atom',
						       args: {value: ''}});
	    yield* branchStore.fork('br1', v1);
	    v1 = (yield* branchStore.trans(v1, {_type: 'set',
						_key: 'foo',
						from: '',
						to: 'FOO'})).v;
	    yield* branchStore.push('br1', v1);
	    var head = {};
	    while(head.$ !== v1.$) { // Wait until the head of br1 becomes v1
		head = yield* branchStore.head('br1');
		yield function(_) { setTimeout(_, 1); };
	    }
	    assert.equal(head.$, v1.$);
	}));
	it('should throw an exception on a conflict', asyncgen.async(function*(){
	    var v0 = yield* branchStore.init('array', {elementType: 'atom',
						       args: {value: ''}});
	    yield* branchStore.fork('br1', v0);
	    var v1 = v0;
	    v1 = (yield* branchStore.trans(v1, {_type: 'set',
						_key: 'foo',
						from: '',
						to: 'FOO1'})).v;
	    yield* branchStore.push('br1', v1); // So far so good
	    var v2 = v0;
	    v2 = (yield* branchStore.trans(v2, {_type: 'set',
						_key: 'foo',
						from: '',
						to: 'FOO2'})).v;
	    try {
		yield* branchStore.push('br1', v2); // This should throw
		assert(false, 'the previos statement should fail');
	    } catch(e) {
		if(!e.isConflict) {
		    throw e;
		}
		assert.equal(e.message, 'Expected:  actual: FOO1');
	    }
	}));
	it('should retry the update in case of a race with another push', asyncgen.async(function*(){
	    var v0 = yield* branchStore.init('array', {elementType: 'atom',
						       args: {value: ''}});
	    yield* branchStore.fork('br1', v0);
	    function* changeAndPush(key, value) {
		var v = yield* branchStore.head('br1');
		v = (yield* branchStore.trans(v, {_type: 'set', 
						  _key: key,
						  from: '',
						  to: value})).v;
		yield* branchStore.push('br1', v);
	    }
	    yield* asyncgen.parallel([changeAndPush('foo', 'FOO'),
				      changeAndPush('bar', 'BAR')]);
	    yield function(_) { setTimeout(_, 4); }; // Let the dust settle
	    var v = yield* branchStore.head('br1');
	    assert.equal((yield* branchStore.trans(v, {_type: 'get',
						       _key: 'foo'})).r, 'FOO');
	    assert.equal((yield* branchStore.trans(v, {_type: 'get',
						       _key: 'bar'})).r, 'BAR');
	}));
	it('should commit all changes in v as a single atomic transaction if atomic is true', asyncgen.async(function*(){
	    var v0 = yield* branchStore.init('array', {elementType: 'atom',
						       args: {value: ''}});
	    var v1 = v0;
	    yield* branchStore.fork('br1', v1);
	    v1 = (yield* branchStore.trans(v1, {_type: 'set',
						_key: 'foo',
						from: '',
						to: 'FOO1'})).v;
	    yield* branchStore.push('br1', v1);
	    
	    var v2 = v0;
	    yield* branchStore.fork('br2', v2);
	    v2 = (yield* branchStore.trans(v2, {_type: 'set',
						_key: 'foo',
						from: '',
						to: 'FOO2'})).v;
	    v2 = (yield* branchStore.trans(v2, {_type: 'set',
						_key: 'bar',
						from: '',
						to: 'BAR'})).v;
	    yield* branchStore.push('br2', v2, true); // Atomic commit

	    yield function(_) { setTimeout(_, 4); };
	    
	    // Now we merge br1 and br2, giving priority to br1
	    v2 = yield* branchStore.pull(yield* branchStore.head('br2'), 'br1');
	    assert.equal((yield* branchStore.trans(v2, {_type: 'get', 
							_key: 'foo'})).r, 'FOO1');
	    assert.equal((yield* branchStore.trans(v2, {_type: 'get', 
							_key: 'bar'})).r, '');
	    
	}));

    });
    describe('.pull(v, b)', function(){
	it('should return a merge between the head of b and v', asyncgen.async(function*(){
	    var v0 = yield* branchStore.init('array', {elementType: 'atom',
						       args: {value: ''}});
	    var v1 = v0;
	    v1 = (yield* branchStore.trans(v1, {_type: 'set',
						_key: 'foo',
						from: '',
						to: 'FOO'})).v;
	    yield* branchStore.fork('br1', v1);
	    var v2 = v0;
	    v2 = (yield* branchStore.trans(v2, {_type: 'set',
						_key: 'bar',
						from: '',
						to: 'BAR'})).v;
	    v2 = yield* branchStore.pull(v2, 'br1');
	    assert.equal((yield* branchStore.trans(v2, {_type: 'get',
							_key: 'foo'})).r, 'FOO');
	    assert.equal((yield* branchStore.trans(v2, {_type: 'get',
							_key: 'bar'})).r, 'BAR');
	    
	}));
	it('should resolve conflicts by preferring the branch', asyncgen.async(function*(){
	    var v0 = yield* branchStore.init('array', {elementType: 'atom',
						       args: {value: ''}});
	    var v1 = v0;
	    v1 = (yield* branchStore.trans(v1, {_type: 'set',
						_key: 'foo',
						from: '',
						to: 'FOO1'})).v;
	    yield* branchStore.fork('br1', v1);
	    var v2 = v0;
	    v2 = (yield* branchStore.trans(v2, {_type: 'set',
						_key: 'foo',
						from: '',
						to: 'FOO2'})).v;
	    v2 = yield* branchStore.pull(v2, 'br1');
	    assert.equal((yield* branchStore.trans(v2, {_type: 'get',
							_key: 'foo'})).r, 'FOO1');
	}));
    });
});
