# TOC
   - [compareKeys(key1, key2)](#comparekeyskey1-key2)
   - [JsMapper](#jsmapper)
   - [.loadModule(ctx, rootID, key) [async]](#loadmodulectx-rootid-key-async)
   - [Text](#text)
     - [get{}](#text-get)
     - [patch{patch}](#text-patchpatch)
     - [put{value}](#text-putvalue)
   - [textutil](#textutil)
     - [.revertPatches(patch)](#textutil-revertpatchespatch)
   - [Treap](#treap)
     - [_keys{limit?, start?}](#treap-_keyslimit-start)
     - [_remap{mapper?, oldMapping?, keyFrom, keyTo}](#treap-_remapmapper-oldmapping-keyfrom-keyto)
     - [_get_ver{_key}](#treap-_get_ver_key)
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

<a name="jsmapper"></a>
# JsMapper
should map values to patches based on Javascript code.

```js
function* (){
	var code = [
	    "exports.doubleToDest = function (key, val) {",
	    "    key = ['dest'].concat(key.slice(1));    ",
	    "    return [{_type: 'set',		     ",
	    "	     _key: key,			     ",
	    "	     from: '',			     ",
	    "	     to: val * 2}];		     ",
	    "};                                      ",
	].join('\n');
	yield* otb.trans({_type: 'put', _key: ['src', 'a'], value: 1});
	yield* otb.trans({_type: 'put', _key: ['src', 'b'], value: 2});
	yield* otb.trans({_type: 'put', _key: ['js', 'map.js'], value: code});
	var mapper = yield* otb.objectStore().init('JsMapper', {
	    rootID: otb.current(),
	    key: ['js', 'map.js'],
	    name: 'doubleToDest',
	});
	yield* otb.trans({_type: '_remap', 
			  mapper: mapper,
			  keyFrom: ['src'],
			  keyTo: ['src', []]});
	assert.equal(yield* otb.trans({_type: 'get', _key: ['dest', 'a']}), 2);
	assert.equal(yield* otb.trans({_type: 'get', _key: ['dest', 'b']}), 4);
```

<a name="loadmodulectx-rootid-key-async"></a>
# .loadModule(ctx, rootID, key) [async]
should return a module for the given Javascript code.

```js
function* (){
	var ostore = createOStore(function*(ctx, p, u) {
	    var module = yield* vdb.loadModule(ctx, p.tree, ['scripts', 'foo.js']);
	    return module.foo();
	});
	var tree = yield* ostore.init('Treap', {elementType: 'atom', args: {value: ''}});
	tree = (yield* ostore.trans(tree, {_type: 'set', 
					   _key: ['scripts', 'foo.js'],
					   from: '', 
					   to: 'exports.foo = function() { return "FOO"; };'})).v;
	var test = yield* ostore.init('test', {});
	var res = yield* ostore.trans(test, {_type: 'test', tree: tree});
	assert.equal(res.r, 'FOO');
```

should not give the module access to gloabls.

```js
function* (){
	try {
	    yield* testModule('exports.foo = function() { process.exit(); };');
	} catch(e) {
	    assert.equal(e.message, "Cannot read property 'exit' of undefined");
	}
```

<a name="text"></a>
# Text
<a name="text-get"></a>
## get{}
should return the content of the text object.

```js
function* (){
	    var v = yield* otb.objectStore().init('Text', {text: 'Foo'});
	    assert.equal((yield* otb.objectStore().trans(v, {_type: 'get'})).r, 'Foo');
```

<a name="text-patchpatch"></a>
## patch{patch}
should apply the given patch to the text.

```js
function* (){
	    var dmp = new DiffMatchPatch();
	    var patch = dmp.patch_make('', 'this is some text');
	    patch = dmp.patch_toText(patch);
	    yield* otb.trans({_type: 'patch', patch: patch});
	    assert.equal(yield* otb.trans({_type: 'get'}), 'this is some text');
```

should report a conflict if one is detected.

```js
function* (){
	    var dmp = new DiffMatchPatch();
	    var patch0 = dmp.patch_toText(dmp.patch_make('', 'The answer is: $'));
	    var patch1 = dmp.patch_toText(dmp.patch_make('The answer is: $', 'The answer is: yes $'));
	    var patch2 = dmp.patch_toText(dmp.patch_make('The answer is: $', 'The answer is: no $'));
	    yield* otb.trans({_type: 'patch', patch: patch0});
	    yield* otb.trans({_type: 'patch', patch: patch1});
	    try {
		yield* otb.trans({_type: 'patch', patch: patch2});
		assert(false, 'Previous line should fail');
	    } catch(e) {
		if(!e.isConflict) throw e;
	    }
```

should allow merges.

```js
function* (){
	    var dmp = new DiffMatchPatch();
	    var patch0 = dmp.patch_toText(dmp.patch_make('', 'hello, world! how are you doing today?'));
	    var patch1 = dmp.patch_toText(dmp.patch_make('hello, world! how are you doing today?', 'hello, WORLD! how are you doing today?'));
	    var patch2 = dmp.patch_toText(dmp.patch_make('hello, world! how are you doing today?', 'hello, world! how are you doing TODAY?'));
	    yield* otb.trans({_type: 'patch', patch: patch0});
	    yield* otb.trans({_type: 'patch', patch: patch1});
	    yield* otb.trans({_type: 'patch', patch: patch2});
	    assert.equal(yield* otb.trans({_type: 'get'}), 'hello, WORLD! how are you doing TODAY?');
```

<a name="text-putvalue"></a>
## put{value}
should modify the text to the given value.

```js
function* (){
	    yield* otb.trans({_type: 'put', value: 'Hello, world'});
	    assert.equal(yield* otb.trans({_type: 'get'}), 'Hello, world');
```

<a name="textutil"></a>
# textutil
<a name="textutil-revertpatchespatch"></a>
## .revertPatches(patch)
should revert a patch.

```js
var text1 = "Hello, world";
var text2 = "Hola, mondi";
var patches = dmp.patch_make(text1, text2);
var patchRes = dmp.patch_apply(textutil.revertPatches(patches), text2);
assert(patchRes[1].reduce(AND, true), 'All patches should succeed');
assert.equal(patchRes[0], text1);
```

should handle more complex strings.

```js
testReversal('hi, who did you say you were?',
			 'Hi, Who Did You say you Were?');
testReversal('abcdefghijklmn\nopqrstuvwxyz',
			 'abcdefghijkLmnopqrsTuvwxyz');
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

should add the key to _reapply patches received from the value.

```js
function* (){
	yield* otb.trans({_type: 'put', _key: 'foo', value: 'x'});
```

<a name="treap-_keyslimit-start"></a>
## _keys{limit?, start?}
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

<a name="treap-_remapmapper-oldmapping-keyfrom-keyto"></a>
## _remap{mapper?, oldMapping?, keyFrom, keyTo}
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

should cancel the inverse and direct patch if they are equal.

```js
function* (){
	    var env = yield* testEnv();
	    var res = yield* env.ostore.trans(env.v, {_type: '_remap', 
						      mapper: env.mapper, 
						      keyFrom: 0, 
						      keyTo: 100});
	    var seq = env.ostore.getSequenceStore();

	    res = yield* env.ostore.trans(res.v, {_type: 'set', _key: 3, from: '', to: 'x'});

	    res = yield* env.ostore.trans(res.v, {_type: 'set', _key: 3, from: 'x', to: 'x'});
	    assert.deepEqual(yield* effectPatches(seq, res.eff), []);
```

should return the ID of the mapping as a string.

```js
function* (){
	    var env = yield* testEnv();
	    var res = yield* env.ostore.trans(env.v, {_type: '_remap', 
						      mapper: env.mapper, 
						      keyFrom: 0, 
						      keyTo: 100});
	    assert.equal(typeof res.r, 'string');
```

should conflict if such mapping already exists.

```js
function* (){
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
```

should conflict if such mapping already exists (non-empty case).

```js
function* (){
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
```

should not conflict if given the old mapping ID.

```js
function* (){
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
```

should not conflict if given the old mapping ID (non empty case).

```js
function* (){
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
```

should effect the inverse of what has been effected by a mapping when removed.

```js
function* (){
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
```

should eliminate patches that do not change due to the mapping replacement.

```js
function* (){
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
```

<a name="treap-_get_ver_key"></a>
## _get_ver{_key}
should return the version ID of the value corresponding to the given key.

```js
function* (){
	    yield* otb.trans({_type: 'put', _key: 'foo', value: 'x'});
	    yield* otb.trans({_type: 'put', _key: 'bar', value: 'x'});
	    assert.equal((yield* otb.trans({_type: '_get_ver', _key: 'foo'})).$, 
			 (yield* otb.trans({_type: '_get_ver', _key: 'bar'})).$);
	    yield* otb.trans({_type: 'put', _key: 'baz', value: 'y'});
	    assert.notEqual((yield* otb.trans({_type: '_get_ver', _key: 'foo'})).$, 
			    (yield* otb.trans({_type: '_get_ver', _key: 'baz'})).$);
```

