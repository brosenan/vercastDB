# TOC
   - [compareKeys(key1, key2)](#comparekeyskey1-key2)
   - [Treap](#treap)
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
	var depth = (yield* ostore.trans(v, {_type: '_depth'})).r;
	assert(depth < 20, 'the depth should be less than the size');
	for(let i = 0; i < 100; i++) {
	    v = (yield* ostore.trans(v, {_type: 'set', 
					 _key: i, 
					 from: i*2, 
					 to: ''})).v;
	}
	depth = (yield* ostore.trans(v, {_type: '_depth'})).r;
	assert.equal(depth, 0);
```

