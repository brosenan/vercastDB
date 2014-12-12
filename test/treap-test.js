"use strict";
var assert = require('assert');

var asyncgen = require('asyncgen');
var vercast = require('vercast');
var vdb = require('vercastDB');

var dispMap = Object.create(vercast.examples);
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
    it('should add the key to _reapply patches received from the value', asyncgen.async(function*(){
	yield* otb.trans({_type: 'put', _key: 'foo', value: 'x'});
    }));

    describe('_keys{limit?, start?}', function(){
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
    describe('_remap{mapper?, oldMapping?, keyFrom, keyTo}', function(){
	it('should call the given mapper\'s map patch with all the non-default values in the range', asyncgen.async(function*(){
	    var myDispMap = Object.create(dispMap);
	    var keys = [];
	    var values = [];
	    dispMap.myMapper = {
		init: function*() {},
		map: function*(ctx, p, u) {
		    keys.push(p.key);
		    values.push(p.value);
		    return [];
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
	    assert.deepEqual(values, ['b', 'c']);
	}));
	it('should effect the patches that are returned by the mapper', asyncgen.async(function*(){
	    var myDispMap = Object.create(dispMap);
	    var keys = [];
	    var values = [];
	    dispMap.myMapper = {
		init: function*() {},
		map: function*(ctx, p, u) {
		    var patches = [];
		    if(p.value !== '') {
			patches.push({_type: 'somePatch',
				      value: p.value});
		    }
		    return patches;
		},
	    };
	    var ostore = new vercast.DummyObjectStore(new vercast.ObjectDispatcher(myDispMap));
	    var v = yield* ostore.init('Treap', {elementType: 'atom', args:  {value: ''}});
	    v = (yield* ostore.trans(v, {_type: 'set', _key: ['foo', 'bar'], from: '', to: 'b'})).v;
	    v = (yield* ostore.trans(v, {_type: 'set', _key: ['foo', 'baz'], from: '', to: 'c'})).v;
	    var mapper = yield* ostore.init('myMapper', {});
	    var eff = (yield* ostore.trans(v, {_type: '_remap', 
					       mapper: mapper, 
					       keyFrom: ['foo'], 
					       keyTo: ['foo', []]})).eff;
	    var seq = ostore.getSequenceStore();
	    yield* seq.append(eff);
	    assert.deepEqual(yield* seq.shift(), {_type: 'somePatch', value: 'b'});
	    assert.deepEqual(yield* seq.shift(), {_type: 'somePatch', value: 'c'});
	}));
	function* testEnv() {
	    var myDispMap = Object.create(dispMap);
	    var keys = [];
	    var values = [];
	    dispMap.myMapper = {
		init: function*() {},
		map: function*(ctx, p, u) {
		    var patches = [];
		    if(p.value !== '') {
			patches.push({_type: 'somePatch',
				      value: p.value});
		    }
		    return patches;
		},
	    };
	    var otb = new vercast.ObjectTestBed(dispMap);
	    var ostore = otb.objectStore(); //new vercast.DummyObjectStore(new vercast.ObjectDispatcher(myDispMap));
	    var v = yield* ostore.init('Treap', {elementType: 'atom', args:  {value: ''}});
	    var mapper = yield* ostore.init('myMapper', {});
	    return {ostore: ostore, v: v, mapper: mapper};
	}
	it('should make future changes to the range have the effect returned by the mapper', asyncgen.async(function*(){
	    var env = yield* testEnv();
	    var res = yield* env.ostore.trans(env.v, {_type: 'set', _key: ['foo', 'bar'], from: '', to: 'w'});
	    res = yield* env.ostore.trans(res.v, {_type: '_remap', 
						  mapper: env.mapper, 
						  keyFrom: ['foo'], 
						  keyTo: ['foo', []]});
	    var seq = env.ostore.getSequenceStore();

	    res = yield* env.ostore.trans(res.v, {_type: 'set', _key: ['foo', 'bat'], from: '', to: 'x'});
	    yield* seq.append(res.eff);
	    assert.deepEqual(yield* seq.shift(), {_type: 'somePatch', value: 'x'});

	    // If not in range, effect should not be given
	    res = yield* env.ostore.trans(res.v, {_type: 'set', _key: ['foox', 'xar'], from: '', to: 'z'});
	    assert.equal(res.eff, '');
	}));
	it('should support cases where the range is empty before creating the map', asyncgen.async(function*(){
	    var env = yield* testEnv();
	    var res = yield* env.ostore.trans(env.v, {_type: 'set', _key: ['foox', 'aar'], from: '', to: 'w'});
	    res = yield* env.ostore.trans(res.v, {_type: '_remap', 
					     mapper: env.mapper, 
					     keyFrom: ['foo'], 
					     keyTo: ['foo', []]});
	    var seq = env.ostore.getSequenceStore();

	    res = yield* env.ostore.trans(res.v, {_type: 'set', _key: ['foo', 'bat'], from: '', to: 'x'});
	    yield* seq.append(res.eff);
	    assert.deepEqual(yield* seq.shift(), {_type: 'somePatch', value: 'x'});
	}));
	it('should work properly even at the event of a rotation', asyncgen.async(function*(){
	    var env = yield* testEnv();
	    var res = yield* env.ostore.trans(env.v, {_type: 'set', _key: ['foo', 'baz'], from: '', to: 'x'});
	    res = yield* env.ostore.trans(res.v, {_type: '_remap', 
					     mapper: env.mapper, 
					     keyFrom: ['foo'], 
					     keyTo: ['foo', []]});
	    var seq = env.ostore.getSequenceStore();

	    // This one will cause a rotation and will become the new root
	    res = yield* env.ostore.trans(res.v, {_type: 'set', _key: ['foo', 'bar'], from: '', to: 'y'});
	    yield* seq.append(res.eff);
	    assert.deepEqual(yield* seq.shift(), {_type: 'somePatch', value: 'y'});

	    // This will be placed a the right side of the new root, 
	    // and will get the effect only if the new root is notified
	    res = yield* env.ostore.trans(res.v, {_type: 'set', _key: ['foo', 'bat'], from: '', to: 'z'});
	    yield* seq.append(res.eff);
	    assert.deepEqual(yield* seq.shift(), {_type: 'somePatch', value: 'z'});
	}));
	it('should support multiple ranges', asyncgen.async(function*(){
	    var env = yield* testEnv();
	    var res = yield* env.ostore.trans(env.v, {_type: '_remap', 
						      mapper: env.mapper, 
						      keyFrom: 0 /*inclusive*/, 
						      keyTo: 2 /*exclusive*/});
	    res = yield* env.ostore.trans(res.v, {_type: '_remap', 
						  mapper: env.mapper, 
						  keyFrom: 1, 
						  keyTo: 3});
	    var seq = env.ostore.getSequenceStore();

	    res = yield* env.ostore.trans(res.v, {_type: 'set', _key: 0, from: '', to: 'x'});
	    assert.equal((yield* effectPatches(seq, res.eff)).length, 1);

	    res = yield* env.ostore.trans(res.v, {_type: 'set', _key: 1, from: '', to: 'x'});
	    assert.equal((yield* effectPatches(seq, res.eff)).length, 2);

	    res = yield* env.ostore.trans(res.v, {_type: 'set', _key: 2, from: '', to: 'x'});
	    assert.equal((yield* effectPatches(seq, res.eff)).length, 1);
	}));
	function* effectPatches(seq, eff) {
	    var patches = [];
	    yield* seq.append(eff);
	    while(!seq.isEmpty()) {
		patches.push(yield* seq.shift());
	    }
	    return patches;
	}
	it('should emit the inverse of the patch corresponding to the previous value before the patch corresponding to the new value', asyncgen.async(function*(){
	    var env = yield* testEnv();
	    var res = yield* env.ostore.trans(env.v, {_type: '_remap', 
						      mapper: env.mapper, 
						      keyFrom: 0, 
						      keyTo: 100});
	    var seq = env.ostore.getSequenceStore();

	    res = yield* env.ostore.trans(res.v, {_type: 'set', _key: 3, from: '', to: 'x'});

	    res = yield* env.ostore.trans(res.v, {_type: 'set', _key: 3, from: 'x', to: 'y'});
	    assert.deepEqual(yield* effectPatches(seq, res.eff), [{_type: 'inv', patch: {_type: 'somePatch', value: 'x'}}, 
								  {_type: 'somePatch', value: 'y'}]);
	}));
	it('should cancel the inverse and direct patch if they are equal', asyncgen.async(function*(){
	    var env = yield* testEnv();
	    var res = yield* env.ostore.trans(env.v, {_type: '_remap', 
						      mapper: env.mapper, 
						      keyFrom: 0, 
						      keyTo: 100});
	    var seq = env.ostore.getSequenceStore();

	    res = yield* env.ostore.trans(res.v, {_type: 'set', _key: 3, from: '', to: 'x'});

	    res = yield* env.ostore.trans(res.v, {_type: 'set', _key: 3, from: 'x', to: 'x'});
	    assert.deepEqual(yield* effectPatches(seq, res.eff), []);
	}));
	it('should return the ID of the mapping as a string', asyncgen.async(function*(){
	    var env = yield* testEnv();
	    var res = yield* env.ostore.trans(env.v, {_type: '_remap', 
						      mapper: env.mapper, 
						      keyFrom: 0, 
						      keyTo: 100});
	    assert.equal(typeof res.r, 'string');
	}));
	it('should conflict if such mapping already exists', asyncgen.async(function*(){
	    var env = yield* testEnv();
	    var res = yield* env.ostore.trans(env.v, {_type: '_remap', 
						      mapper: env.mapper, 
						      keyFrom: 0, 
						      keyTo: 100});
	    try {
		res = yield* env.ostore.trans(res.v, {_type: '_remap', 
						      mapper: env.mapper, 
						      keyFrom: 0, 
						      keyTo: 100});
		assert(false, "the previous statement should fail");
	    } catch(e) {
		if(!e.isConflict) throw e;
	    }
	}));

	it('should conflict if such mapping already exists (non-empty case)', asyncgen.async(function*(){
	    var env = yield* testEnv();
	    var res = yield* env.ostore.trans(env.v, {_type: 'set', _key: 3, from: '', to: 'x'});
	    res = yield* env.ostore.trans(res.v, {_type: '_remap', 
						      mapper: env.mapper, 
						      keyFrom: 0, 
						      keyTo: 100});
	    try {
		res = yield* env.ostore.trans(res.v, {_type: '_remap', 
						      mapper: env.mapper, 
						      keyFrom: 0, 
						      keyTo: 100});
		assert(false, "the previous statement should fail");
	    } catch(e) {
		if(!e.isConflict) throw e;
	    }
	}));
	it('should not conflict if given the old mapping ID', asyncgen.async(function*(){
	    var env = yield* testEnv();
	    var res = yield* env.ostore.trans(env.v, {_type: '_remap', 
						      mapper: env.mapper, 
						      keyFrom: 0, 
						      keyTo: 100});
	    res = yield* env.ostore.trans(res.v, {_type: '_remap', 
						  mapper: env.mapper, 
						  oldMapping: res.r,
						  keyFrom: 0, 
						  keyTo: 100});
	}));

	it('should not conflict if given the old mapping ID (non empty case)', asyncgen.async(function*(){
	    var env = yield* testEnv();
	    var res = yield* env.ostore.trans(env.v, {_type: 'set', _key: 3, from: '', to: 'x'});
	    res = yield* env.ostore.trans(res.v, {_type: '_remap', 
						      mapper: env.mapper, 
						      keyFrom: 0, 
						      keyTo: 100});
	    res = yield* env.ostore.trans(res.v, {_type: '_remap', 
						  mapper: env.mapper, 
						  oldMapping: res.r,
						  keyFrom: 0, 
						  keyTo: 100});
	}));

	it('should effect the inverse of what has been effected by a mapping when removed', asyncgen.async(function*(){
	    var env = yield* testEnv();
	    var res = yield* env.ostore.trans(env.v, {_type: '_remap', 
						      mapper: env.mapper, 
						      keyFrom: 0, 
						      keyTo: 100});
	    var oldMapping = res.r;
	    res = yield* env.ostore.trans(res.v, {_type: 'set', _key: 3, from: '', to: 'x'});
	    res = yield* env.ostore.trans(res.v, {_type: 'set', _key: 6, from: '', to: 'y'});

	    var res = yield* env.ostore.trans(res.v, {_type: '_remap', 
						      oldMapping: oldMapping, 
						      keyFrom: 0, 
						      keyTo: 100});
	    var seq = env.ostore.getSequenceStore();
	    assert.deepEqual(yield* effectPatches(seq, res.eff), 
			     [{_type: 'inv', patch : {_type: 'somePatch', value: 'x'}}, 
			      {_type: 'inv', patch : {_type: 'somePatch', value: 'y'}}]);
	}));
	it('should eliminate patches that do not change due to the mapping replacement', asyncgen.async(function*(){
	    var env = yield* testEnv();
	    var res = yield* env.ostore.trans(env.v, {_type: '_remap', 
						      mapper: env.mapper, 
						      keyFrom: 0, 
						      keyTo: 100});
	    var oldMapping = res.r;
	    res = yield* env.ostore.trans(res.v, {_type: 'set', _key: 3, from: '', to: 'x'});
	    res = yield* env.ostore.trans(res.v, {_type: 'set', _key: 6, from: '', to: 'y'});

	    var res = yield* env.ostore.trans(res.v, {_type: '_remap', 
						      mapper: env.mapper, // The new mapper is identical to the old one
						      oldMapping: oldMapping,
						      keyFrom: 0, 
						      keyTo: 100});
	    var seq = env.ostore.getSequenceStore();
	    assert.deepEqual(yield* effectPatches(seq, res.eff), []);
	}));
    });
    describe('_get_ver{_key}', function(){
	it('should return the version ID of the value corresponding to the given key', asyncgen.async(function*(){
	    yield* otb.trans({_type: 'put', _key: 'foo', value: 'x'});
	    yield* otb.trans({_type: 'put', _key: 'bar', value: 'x'});
	    assert.equal((yield* otb.trans({_type: '_get_ver', _key: 'foo'})).$, 
			 (yield* otb.trans({_type: '_get_ver', _key: 'bar'})).$);
	    yield* otb.trans({_type: 'put', _key: 'baz', value: 'y'});
	    assert.notEqual((yield* otb.trans({_type: '_get_ver', _key: 'foo'})).$, 
			    (yield* otb.trans({_type: '_get_ver', _key: 'baz'})).$);
	}));

    });

});
