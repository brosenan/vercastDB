# TOC
   - [compareKeys(key1, key2)](#comparekeyskey1-key2)
   - [Treap](#treap)
     - [_keys](#treap-_keys)
     - [_remap](#treap-_remap)
<a name=""></a>
 
<a name="comparekeyskey1-key2"></a>
# compareKeys(key1, key2)
should compare strings lexicographically.

```js
// 'a' < 'b'
assert.equal(vdb.compareKeys('a', 'b'), -1);
// 'b' > 'a'
assert.equal(vdb.compareKeys('b', 'a'), 1);
// 'foo' === 'foo'
assert.equal(vdb.compareKeys('a', 'a'), 0);
```

should compare numbers numerically.

```js
// 2 < 10
assert.equal(vdb.compareKeys(2, 10), -1);
// 10 > 2
assert.equal(vdb.compareKeys(10, 2), 1);
// 33 === 33
assert.equal(vdb.compareKeys(33, 33), 0);
```

should consider an array as more than anything else.

```js
// [] > 10
assert.equal(vdb.compareKeys([], 10), 1);
// 10 < []
assert.equal(vdb.compareKeys(10, []), -1);
// [] > '~'
assert.equal(vdb.compareKeys([], '~'), 1);
// '~' < []
assert.equal(vdb.compareKeys('~', []), -1);
```

should compare arrays lexicographically.

```js
assert.equal(vdb.compareKeys(['a', 'a'], ['a', 'b']), -1);
assert.equal(vdb.compareKeys(['a', 'b'], ['a', 'a']), 1);

assert.equal(vdb.compareKeys(['b', 'a'], ['a', 'b']), 1);
assert.equal(vdb.compareKeys(['a', 'b'], ['b', 'a']), -1);

assert.equal(vdb.compareKeys(['b', 'a'], ['a', 'b', 'c']), 1);
assert.equal(vdb.compareKeys(['a', 'b', 'c'], ['b', 'a']), -1);
```

should treat prefix arrays as less than longer arrays.

```js
assert.equal(vdb.compareKeys([1, 2, 3], [1, 2, 3, 4]), -1);
assert.equal(vdb.compareKeys([1, 2, 3, 4], [1, 2, 3]), 1);
assert.equal(vdb.compareKeys([1, 2, 3, 4], [1, 2, 3, 4]), 0);
```

should recurse to compare nested arrays.

```js
assert.equal(vdb.compareKeys(['a', 'b', '~'], ['a', 'b', []]), -1);
assert.equal(vdb.compareKeys(['a', 'b', []], ['a', 'b', '~']), 1);
```

should be able to compare proxies (objects with get() and set() methods) to real arrays.

```js
var obj = {};
obj.array = [1, 2, 3];
var monitor = new vercast.ObjectMonitor(obj);
var proxy = monitor.proxy();
assert.equal(vdb.compareKeys([1, 2, 3], proxy.array), 0);
assert.equal(vdb.compareKeys(proxy.array, [1, 2, 2]), 1);
assert.equal(vdb.compareKeys(proxy.array, [1, 2]), 1);
assert.equal(vdb.compareKeys([1, 2, []], proxy.array), 1);
```

<a name="treap"></a>
# Treap
should apply patches to different objects, by the patch's _key attribute.

```js
function* (){
	yield* otb.trans({_type: 'set', _key: 'foo', from: '', to: 'x'});
	assert.equal(yield* otb.trans({_type: '_count'}), 1);
	yield* otb.trans({_type: 'set', _key: 'bar', from: '', to: 'y'});
	assert.equal(yield* otb.trans({_type: 'get', _key: 'foo'}), 'x');
	assert.equal(yield* otb.trans({_type: '_count'}), 2);
	yield* otb.trans({_type: '_validate'});
```

should not count nodes containing values that match the default value.

```js
function* (){
	yield* otb.trans({_type: 'set', _key: 5, from: '', to: 'x'});
	yield* otb.trans({_type: 'set', _key: 7, from: '', to: 'y'});
	assert.equal(yield* otb.trans({_type: '_count'}), 2);
	yield* otb.trans({_type: 'set', _key: 5, from: 'x', to: ''});
	assert.equal(yield* otb.trans({_type: '_count'}), 1);
```

should be mostly balanced.

```js
function* (){
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
```

<a name="treap-_keys"></a>
## _keys
should return a sorted list of the keys in the tree.

```js
function* (){
	    for(let i = 0; i < 4; i++) {
		yield* otb.trans({_type: 'set',
				  _key: i,
				  from: '',
				  to: i*2});
	    }
	    var keys = yield* otb.trans({_type: '_keys'});
	    assert.deepEqual(keys, [0, 1, 2, 3]);
```

should not give more results then the given limit, if provided.

```js
function* (){
	    var s = yield* createOStore();
	    var keys = (yield* s.ostore.trans(s.v, {_type: '_keys',
						    limit: 3})).r;
	    assert.deepEqual(keys, [0, 1, 2]);
```

should start at the given start position if given.

```js
function* (){
	    var s = yield* createOStore();
	    var keys = (yield* s.ostore.trans(s.v, {_type: '_keys',
						    start: 90})).r;
	    assert.deepEqual(keys, [90, 91, 92, 93, 94, 95, 96, 97, 98, 99]);
```

<a name="treap-_remap"></a>
## _remap
should call the given mapper's map patch with all the non-default values in the range.

```js
function* (){
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
```

should effect the patches that are returned by the mapper.

```js
function* (){
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
```

should make future changes to the range have the effect returned by the mapper.

```js
function* (){
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
```

should support cases where the range is empty before creating the map.

```js
function* (){
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
```

should work properly even at the event of a rotation.

```js
function* (){
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
```

should support multiple ranges.

```js
function* (){
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
```

should emit the inverse of the patch corresponding to the previous value before the patch corresponding to the new value.

```js
function* (){
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
```

