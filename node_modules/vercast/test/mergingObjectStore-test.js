"use strict";
var assert = require('assert');

var asyncgen = require('asyncgen'); 
var vercast = require('vercast');

var graphDB = new vercast.DummyGraphDB();
var kvs = new vercast.DummyKeyValueStore();
var seqFactory = new vercast.SequenceStoreFactory(kvs);
var versionGraph = new vercast.SimpleVersionGraph(graphDB);
var ostore = new vercast.DummyObjectStore(new vercast.ObjectDispatcher(vercast.examples), seqFactory);
ostore = new vercast.RootStore(ostore);
ostore = new vercast.MergingObjectStore(ostore, versionGraph, seqFactory);

describe('MergingObjectStore', function(){
    describe('.init(type, args)', function(){
	it('should return a new version ID', asyncgen.async(function*(){
	    var v = yield* ostore.init('atom', {value: 'a'});
	    assert.equal((yield* ostore.trans(v, {_type: 'get'})).r, 'a');
	}));
    });
    describe('.trans(v, p) -> {v,r}', function(){
	it('should apply a patch to the state', asyncgen.async(function*(){
	    var v = yield* ostore.init('atom', {value: 'a'});
	    assert.equal((yield* ostore.trans(v, {_type: 'get'})).r, 'a');
	    v = (yield* ostore.trans(v, {_type: 'set', from: 'a', to: 'b'})).v;
	    assert.equal((yield* ostore.trans(v, {_type: 'get'})).r, 'b');
	}));
    });
    describe('.merge(v1, v2, resolve=false, atomic=false)', function(){
	it('should return the merged version of both v1 and v2', asyncgen.async(function*(){
	    var v = yield* ostore.init('array', {elementType: 'atom', args: {value: ''}});
	    var v1 = v;
	    v1 = (yield* ostore.trans(v1, {_type: 'set', _key: 'foo', from: '', to: 'FOO'})).v;
	    var v2 = v;
	    v2 = (yield* ostore.trans(v2, {_type: 'set', _key: 'bar', from: '', to: 'BAR'})).v;
	    var vm = yield* ostore.merge(v1, v2);
	    assert.equal((yield* ostore.trans(vm, {_type: 'get', _key: 'foo'})).r, 'FOO');
	    assert.equal((yield* ostore.trans(vm, {_type: 'get', _key: 'bar'})).r, 'BAR');
	}));
	it('should record each merge so that further merges can be performed', asyncgen.async(function*(){
	    var v = yield* ostore.init('array', {elementType: 'atom', args: {value: ''}});
	    var v1 = v;
	    v1 = (yield* ostore.trans(v1, {_type: 'set', _key: 'foo', from: '', to: 'FOO'})).v;
	    var v2 = v;
	    v2 = (yield* ostore.trans(v2, {_type: 'set', _key: 'bar', from: '', to: 'BAR'})).v;
	    var vm1 = yield* ostore.merge(v1, v2);
	    
	    v1 = (yield* ostore.trans(v1, {_type: 'set', _key: 'baz', from: '', to: 'BAZ'})).v;
	    var vm2 = yield* ostore.merge(v1, vm1);

	    v1 = (yield* ostore.trans(v1, {_type: 'set', _key: 'bat', from: '', to: 'BAT'})).v;
	    var vm3 = yield* ostore.merge(vm2, v1);

	    assert.equal((yield* ostore.trans(vm3, {_type: 'get', _key: 'foo'})).r, 'FOO');
	    assert.equal((yield* ostore.trans(vm3, {_type: 'get', _key: 'bar'})).r, 'BAR');
	    assert.equal((yield* ostore.trans(vm3, {_type: 'get', _key: 'baz'})).r, 'BAZ');
	    assert.equal((yield* ostore.trans(vm3, {_type: 'get', _key: 'bat'})).r, 'BAT');
	}));
	it('should fail on conflict, if resolve === false or omitted', asyncgen.async(function*(){
	    var v = yield* ostore.init('array', {elementType: 'atom', args: {value: ''}});
	    var v1 = v;
	    v1 = (yield* ostore.trans(v1, {_type: 'set', _key: 'foo', from: '', to: 'FOO1'})).v;
	    var v2 = v;
	    v2 = (yield* ostore.trans(v2, {_type: 'set', _key: 'foo', from: '', to: 'FOO2'})).v;
	    try {
		var vm = yield* ostore.merge(v1, v2);
		assert(false, 'The previous statement should fail');
	    } catch(e) {
		assert.equal(e.message, 'Expected:  actual: FOO1');
		assert(e.isConflict, 'this should be a conflict');
	    }
	}));
	it('should pass if resolve === true, preferring v1', asyncgen.async(function*(){
	    var v = yield* ostore.init('array', {elementType: 'atom', args: {value: ''}});
	    var v1 = v;
	    v1 = (yield* ostore.trans(v1, {_type: 'set', _key: 'foo', from: '', to: 'FOO1'})).v;
	    var v2 = v;
	    v2 = (yield* ostore.trans(v2, {_type: 'set', _key: 'foo', from: '', to: 'FOO2'})).v;
	    var vm = yield* ostore.merge(v1, v2, true);
	    assert.equal((yield* ostore.trans(vm, {_type: 'get', _key: 'foo'})).r, 'FOO1');
	}));
	it('should record the merge in such a way that will preserve the resolution decisions', asyncgen.async(function*(){
	    var v = yield* ostore.init('array', {elementType: 'atom', args: {value: ''}});
	    var v1 = v;
	    v1 = (yield* ostore.trans(v1, {_type: 'set', _key: 'foo', from: '', to: 'FOO1'})).v;
	    var v2 = v;
	    v2 = (yield* ostore.trans(v2, {_type: 'set', _key: 'foo', from: '', to: 'FOO2'})).v;
	    var vm = yield* ostore.merge(v1, v2, true);
	    v2 = (yield* ostore.trans(v2, {_type: 'set', _key: 'bar', from: '', to: 'BAR'})).v;
	    var vm2 = yield* ostore.merge(v2, vm, false); // should not be conflicting
	    assert.equal((yield* ostore.trans(vm2, {_type: 'get', _key: 'foo'})).r, 'FOO1');
	}));
	it('should record each patch by itself when atomic is false or omitted', asyncgen.async(function*(){
	    var v = yield* ostore.init('array', {elementType: 'atom', args: {value: ''}});
	    var v1 = v;
	    v1 = (yield* ostore.trans(v1, {_type: 'set', _key: 'foo', from: '', to: 'FOO1'})).v;
	    var v2 = v;
	    v2 = (yield* ostore.trans(v2, {_type: 'set', _key: 'foo', from: '', to: 'FOO2'})).v;
	    v2 = (yield* ostore.trans(v2, {_type: 'set', _key: 'bar', from: '', to: 'BAR'})).v;
	    var vm = yield* ostore.merge(v1, v2, true);
	    assert.equal((yield* ostore.trans(vm, {_type: 'get', _key: 'foo'})).r, 'FOO1');
	    assert.equal((yield* ostore.trans(vm, {_type: 'get', _key: 'bar'})).r, 'BAR');
	}));
	it('should bundle all patches contributed by a merge in a single transaction, if atomic is true', asyncgen.async(function*(){
	    var v = yield* ostore.init('array', {elementType: 'atom', args: {value: ''}});
	    var v1 = v;
	    v1 = (yield* ostore.trans(v1, {_type: 'set', _key: 'foo', from: '', to: 'FOO1'})).v;
	    var v2 = v;
	    v2 = (yield* ostore.trans(v2, {_type: 'set', _key: 'foo', from: '', to: 'FOO2'})).v;
	    v2 = (yield* ostore.trans(v2, {_type: 'set', _key: 'bar', from: '', to: 'BAR'})).v;
	    v2 = yield* ostore.merge(v, v2, false, true); // package everything on v2 as a transaction
	    var vm = yield* ostore.merge(v1, v2, true);
	    assert.equal((yield* ostore.trans(vm, {_type: 'get', _key: 'foo'})).r, 'FOO1');
	    // The  transaction was rolled-back due to a conflict on key foo.
	    assert.equal((yield* ostore.trans(vm, {_type: 'get', _key: 'bar'})).r, '');

	    // The transaction's failure should be recorded, so that merging v2 with vm should keep foo => FOO1
	    v2 = yield* ostore.merge(v2, vm);
	}));
    });
});
