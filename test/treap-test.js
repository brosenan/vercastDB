"use strict";
var assert = require('assert');

var asyncgen = require('asyncgen');
var vercast = require('vercast');
var vdb = require('vercastDB');

var dispMap = {};
for(var key in vercast.examples) {
    dispMap[key] = vercast.examples[key];
}
dispMap.Treap = vdb.Treap;

describe('Treap', function(){
    var otb;
    beforeEach(function() {
	otb = new vercast.ObjectTestBed(dispMap, 'Treap', {elementType: 'atom', args:  {value: ''}});
    });
    it('should apply patches to different objects, by the patch\'s _key attribute', asyncgen.async(function*(){
	yield* otb.trans({_type: 'set', _key: 'foo', from: '', to: 'x'});
	assert.equal(yield* otb.trans({_type: '_count'}), 1);
	yield* otb.trans({_type: 'set', _key: 'bar', from: '', to: 'y'});
	assert.equal(yield* otb.trans({_type: 'get', _key: 'foo'}), 'x');
	assert.equal(yield* otb.trans({_type: '_count'}), 2);
	yield* otb.trans({_type: '_validate'});
    }));
    it('should not count nodes containing values that match the default value', asyncgen.async(function*(){
	yield* otb.trans({_type: 'set', _key: 5, from: '', to: 'x'});
	yield* otb.trans({_type: 'set', _key: 7, from: '', to: 'y'});
	assert.equal(yield* otb.trans({_type: '_count'}), 2);
	yield* otb.trans({_type: 'set', _key: 5, from: 'x', to: ''});
	assert.equal(yield* otb.trans({_type: '_count'}), 1);
    }));
    function* createOStore() {
	var ostore = new vercast.SimpleObjectStore(
	    new vercast.ObjectDispatcher(dispMap),
	    new vercast.DummyKeyValueStore());
	var v = yield* ostore.init('Treap', {elementType: 'atom',
					     args: {value: ''}});
	for(let i = 0; i < 100; i++) {
	    v = (yield* ostore.trans(v, {_type: 'set', 
					   _key: i, 
					   from: '', 
					   to: i*2})).v;
	}
	return {ostore: ostore, v: v};
    }
    it('should be mostly balanced', asyncgen.async(function*(){
	var s = yield* createOStore();
	var depth = (yield* s.ostore.trans(s.v, {_type: '_depth'})).r;
	assert(depth < 20, 'the depth should be less than the size');
	for(let i = 0; i < 100; i++) {
	    s.v = (yield* s.ostore.trans(s.v, {_type: 'set', 
					     _key: i, 
					     from: i*2, 
					     to: ''})).v;
	    yield* s.ostore.trans(s.v, {_type: '_validate'});
	}
	depth = (yield* s.ostore.trans(s.v, {_type: '_depth'})).r;
	assert.equal(depth, 0);
    }));
    describe('_keys', function(){
	it('should return a sorted list of the keys in the tree', asyncgen.async(function*(){
	    for(let i = 0; i < 4; i++) {
		yield* otb.trans({_type: 'set',
				  _key: i,
				  from: '',
				  to: i*2});
	    }
	    var keys = yield* otb.trans({_type: '_keys'});
	    assert.deepEqual(keys, [0, 1, 2, 3]);
	}));
	it('should not give more results then the given limit, if provided', asyncgen.async(function*(){
	    var s = yield* createOStore();
	    var keys = (yield* s.ostore.trans(s.v, {_type: '_keys',
						    limit: 3})).r;
	    assert.deepEqual(keys, [0, 1, 2]);
	}));
	it('should start at the given start position if given', asyncgen.async(function*(){
	    var s = yield* createOStore();
	    var keys = (yield* s.ostore.trans(s.v, {_type: '_keys',
						    start: 90})).r;
	    assert.deepEqual(keys, [90, 91, 92, 93, 94, 95, 96, 97, 98, 99]);
	}));
    });
    describe('_remap', function(){
	it('should call the given mapper\'s map patch with all the non-default values in the range', asyncgen.async(function*(){
	    var myDispMap = Object.create(dispMap);
	    var keys = [];
	    var values = [];
	    dispMap.myMapper = {
		init: function*() {},
		map: function*(ctx, p, u) {
		    keys.push(p.key);
		    values.push(p.value);
		},
	    };
	    var ostore = new vercast.DummyObjectStore(new vercast.ObjectDispatcher(myDispMap));
	    var v = yield* ostore.init('Treap', {elementType: 'atom', args:  {value: ''}});
	    v = (yield* ostore.trans(v, {_type: 'set', _key: 5, from: '', to: 'a'})).v;
	    v = (yield* ostore.trans(v, {_type: 'set', _key: ['foo', 'bar'], from: '', to: 'b'})).v;
	    v = (yield* ostore.trans(v, {_type: 'set', _key: ['foo', 'baz'], from: '', to: 'c'})).v;
	    v = (yield* ostore.trans(v, {_type: 'set', _key: ['foo', []], from: '', to: 'd'})).v;
	    var mapper = yield* ostore.init('myMapper', {});
	    v = (yield* ostore.trans(v, {_type: '_remap', 
					 mapper: mapper, 
					 keyFrom: ['foo'] /*inclusive*/, 
					 keyTo: ['foo', []] /*exclusive*/})).v;
	    assert.deepEqual(keys, [['foo', 'bar'], ['foo', 'baz']]);
	}));

    });

});
