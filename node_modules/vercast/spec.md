# TOC
   - [BranchStore](#branchstore)
     - [.init(type, args)](#branchstore-inittype-args)
     - [.trans(v, p, u) -> {v,r}](#branchstore-transv-p-u---vr)
     - [.fork(b, v)](#branchstore-forkb-v)
     - [.head(b)](#branchstore-headb)
     - [.push(b, v, atomic=false)](#branchstore-pushb-v-atomicfalse)
     - [.pull(v, b)](#branchstore-pullv-b)
   - [DummyAtomicKVS](#dummyatomickvs)
     - [as AtomicKeyValue](#dummyatomickvs-as-atomickeyvalue)
       - [.newKey(key, val)](#dummyatomickvs-as-atomickeyvalue-newkeykey-val)
       - [.retrieve(key))](#dummyatomickvs-as-atomickeyvalue-retrievekey)
       - [.modify(key, oldVal, newVal)](#dummyatomickvs-as-atomickeyvalue-modifykey-oldval-newval)
   - [DummyGraphDB](#dummygraphdb)
     - [as GraphDB](#dummygraphdb-as-graphdb)
       - [addEdge](#dummygraphdb-as-graphdb-addedge)
       - [findCommonAncestor](#dummygraphdb-as-graphdb-findcommonancestor)
     - [.findPath(x, y, cb(err, path))](#dummygraphdb-findpathx-y-cberr-path)
   - [DummyKeyValueStore](#dummykeyvaluestore)
   - [DummyObjectStore](#dummyobjectstore)
     - [.init(type, args)](#dummyobjectstore-inittype-args)
     - [.trans(v, p, u) -> {v, r, eff}](#dummyobjectstore-transv-p-u---v-r-eff)
     - [context](#dummyobjectstore-context)
       - [.init(type, args)](#dummyobjectstore-context-inittype-args)
       - [.trans(v, p, u) -> {v,r,eff}](#dummyobjectstore-context-transv-p-u---vreff)
       - [.conflict(msg)](#dummyobjectstore-context-conflictmsg)
       - [.effect(p)](#dummyobjectstore-context-effectp)
       - [.self()](#dummyobjectstore-context-self)
     - [.addTransListener(handler(v1, p, u, v2, r, eff))](#dummyobjectstore-addtranslistenerhandlerv1-p-u-v2-r-eff)
   - [EventuallyConsistentKVS](#eventuallyconsistentkvs)
     - [.newKey(key, value)](#eventuallyconsistentkvs-newkeykey-value)
     - [.retrieve(key)](#eventuallyconsistentkvs-retrievekey)
     - [.modify(key, value)](#eventuallyconsistentkvs-modifykey-value)
   - [$inv](#inv)
   - [MergingObjectStore](#mergingobjectstore)
     - [.init(type, args)](#mergingobjectstore-inittype-args)
     - [.trans(v, p) -> {v,r}](#mergingobjectstore-transv-p---vr)
     - [.merge(v1, v2, resolve=false, atomic=false)](#mergingobjectstore-mergev1-v2-resolvefalse-atomicfalse)
   - [ObjectDispatcher](#objectdispatcher)
     - [.init(type, args)](#objectdispatcher-inittype-args)
     - [.apply(ctx, obj, patch, unapply)](#objectdispatcher-applyctx-obj-patch-unapply)
   - [ObjectMonitor](#objectmonitor)
     - [.proxy()](#objectmonitor-proxy)
       - [._replaceWith(obj)](#objectmonitor-proxy-_replacewithobj)
     - [.isDirty()](#objectmonitor-isdirty)
     - [.hash()](#objectmonitor-hash)
     - [.seal(obj) [static]](#objectmonitor-sealobj-static)
     - [.revision()](#objectmonitor-revision)
     - [.json()](#objectmonitor-json)
     - [.object()](#objectmonitor-object)
   - [ObjectTestBed](#objecttestbed)
     - [.trans(p)](#objecttestbed-transp)
       - [reversibilityChecker](#objecttestbed-transp-reversibilitychecker)
       - [commutativityChecker](#objecttestbed-transp-commutativitychecker)
   - [RootStore](#rootstore)
     - [.init(type, args)](#rootstore-inittype-args)
     - [.trans(v, p, u) -> {v,r}](#rootstore-transv-p-u---vr)
   - [SequenceStoreFactory](#sequencestorefactory)
     - [.createSequenceStore()](#sequencestorefactory-createsequencestore)
       - [.append(obj)](#sequencestorefactory-createsequencestore-appendobj)
       - [.isEmpty()](#sequencestorefactory-createsequencestore-isempty)
       - [.shift()](#sequencestorefactory-createsequencestore-shift)
       - [.pop()](#sequencestorefactory-createsequencestore-pop)
       - [.hash()](#sequencestorefactory-createsequencestore-hash)
   - [SimpleObjectStore](#simpleobjectstore)
     - [.init(type, args)](#simpleobjectstore-inittype-args)
     - [.trans(v, p, u) -> {v, r, eff}](#simpleobjectstore-transv-p-u---v-r-eff)
     - [context](#simpleobjectstore-context)
       - [.init(type, args)](#simpleobjectstore-context-inittype-args)
       - [.trans(v, p, u) -> {v,r,eff}](#simpleobjectstore-context-transv-p-u---vreff)
       - [.conflict(msg)](#simpleobjectstore-context-conflictmsg)
       - [.effect(p)](#simpleobjectstore-context-effectp)
       - [.self()](#simpleobjectstore-context-self)
   - [SimpleQueue](#simplequeue)
   - [SimpleVersionGraph](#simpleversiongraph)
     - [.recordTrans(v1, p, v2)](#simpleversiongraph-recordtransv1-p-v2)
     - [.getMergeStrategy(v1, v2)](#simpleversiongraph-getmergestrategyv1-v2)
     - [.recordMerge(mergeInfo, newV, p1, p2)](#simpleversiongraph-recordmergemergeinfo-newv-p1-p2)
     - [.appendPatchesTo(mergeInfo, seq, taken)](#simpleversiongraph-appendpatchestomergeinfo-seq-taken)
   - [$transaction](#transaction)
<a name=""></a>
 
<a name="branchstore"></a>
# BranchStore
<a name="branchstore-inittype-args"></a>
## .init(type, args)
should create a new object version, and return its ID.

```js
function* (){
	    var v = yield* branchStore.init('atom', {value: 'foo'});
	    assert.equal((yield* ostore.trans(v, {_type: 'get'})).r, 'foo');
```

<a name="branchstore-transv-p-u---vr"></a>
## .trans(v, p, u) -> {v,r}
should transform an object version according to the given patch.

```js
function* (){
	    var v = yield* branchStore.init('atom', {value: 'foo'});
	    v = (yield* branchStore.trans(v, {_type: 'set', from: 'foo', to: 'bar'})).v;
	    assert.equal((yield* ostore.trans(v, {_type: 'get'})).r, 'bar');
```

<a name="branchstore-forkb-v"></a>
## .fork(b, v)
should create a new branch, starting at the given version ID.

```js
function* (){
	    var v = yield* branchStore.init('atom', {value: 'foo'});
	    yield* branchStore.fork('br1', v);
```

<a name="branchstore-headb"></a>
## .head(b)
should return the last known head of a branch (can be somewhat stale).

```js
function* (){
	    var v1 = yield* branchStore.init('atom', {value: 'foo'});
	    yield* branchStore.fork('br1', v1);
	    var v2 = yield* branchStore.head('br1');
	    assert.equal(typeof v2.$, 'string');
```

should fail gracefully if the branch has not been initialized.

```js
function* (){
	    try {
		yield* branchStore.head('branchThatDoesNotExist', 5); // Only try 5 times
		assert(false, 'Previous statement should fail');
	    } catch(e) {
		assert.equal(e.message, 'Exhausted the number of attempts trying to fetch the head of branch branchThatDoesNotExist');
	    }
```

<a name="branchstore-pushb-v-atomicfalse"></a>
## .push(b, v, atomic=false)
should merge the changes made in v to branch b.

```js
function* (){
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
```

should throw an exception on a conflict.

```js
function* (){
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
```

should retry the update in case of a race with another push.

```js
function* (){
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
```

should commit all changes in v as a single atomic transaction if atomic is true.

```js
function* (){
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
```

<a name="branchstore-pullv-b"></a>
## .pull(v, b)
should return a merge between the head of b and v.

```js
function* (){
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
```

should resolve conflicts by preferring the branch.

```js
function* (){
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
```

<a name="dummyatomickvs"></a>
# DummyAtomicKVS
<a name="dummyatomickvs-as-atomickeyvalue"></a>
## as AtomicKeyValue
<a name="dummyatomickvs-as-atomickeyvalue-newkeykey-val"></a>
### .newKey(key, val)
should store a new key/value pair, given that key does not already exist.

```js
function* (){
		yield* atomicKV.newKey('foo', 'bar');
		var value = yield* atomicKV.retrieve('foo');
		assert.equal(value, 'bar');
```

should emit an error when the key already exists.

```js
function* (){
		try {
		    yield* atomicKV.newKey('foo', 'bar');
		    yield* atomicKV.newKey('foo', 'bar');
		    assert(false, 'An error should be emitted');
		} catch(err) {
		    assert.equal(err.message, 'Key foo already exists');
		}
```

<a name="dummyatomickvs-as-atomickeyvalue-retrievekey"></a>
### .retrieve(key))
should emit an error if the value does not exist.

```js
function* (){
		try {
		    var value = yield* atomicKV.retrieve('foo');
		    assert(false, 'the value is not supposed to be found');
		} catch(err) {
		    assert.equal(err.message, 'Key foo was not found');
		}
```

<a name="dummyatomickvs-as-atomickeyvalue-modifykey-oldval-newval"></a>
### .modify(key, oldVal, newVal)
should change the value under key to newVal, given that the previous value was oldVal.

```js
function* (){
		yield* atomicKV.newKey('foo', 'bar');
		var valAfterMod = yield* atomicKV.modify('foo', 'bar', 'baz');
		assert.equal(valAfterMod, 'baz');
		var val = yield* atomicKV.retrieve('foo');
		assert.equal(val, 'baz');
```

should not change the value under key if the current value does not equal oldVal.

```js
function* (){
		yield* atomicKV.newKey('foo', 'bar');
		var valAfterMod = yield* atomicKV.modify('foo', 'baz', 'bat');
		assert.equal(valAfterMod, 'bar'); // The value before the change
		var val = yield* atomicKV.retrieve('foo');
		assert.equal(val, 'bar');
```

<a name="dummygraphdb"></a>
# DummyGraphDB
<a name="dummygraphdb-as-graphdb"></a>
## as GraphDB
<a name="dummygraphdb-as-graphdb-addedge"></a>
### addEdge
should accept an edge and add it to the graph.

```js
function* (){
		yield* graphDB.addEdge("foo", "likes", "bar");
		var shouldBeBar = yield* graphDB.queryEdge("foo", "likes");
		assert.equal(shouldBeBar, 'bar');
```

should create a dual mapping, mapping also the destination to the source.

```js
function* (){
		    yield* graphDB.addEdge("foo", "likes", "bar");
		    var shouldBeFoo = yield* graphDB.queryBackEdge("bar", "likes"); 
		    assert.equal(shouldBeFoo, 'foo');
```

<a name="dummygraphdb-as-graphdb-findcommonancestor"></a>
### findCommonAncestor
should find the common ancestor of two nodes, and the path to each of them.

```js
function* (){
		yield* graphDB.addEdge('terah', 'p1', 'abraham');
		yield* graphDB.addEdge('abraham', 'p2', 'isaac');
		yield* graphDB.addEdge('isaac', 'p3', 'jacob');
		yield* graphDB.addEdge('jacob', 'p4', 'joseph');
		yield* graphDB.addEdge('abraham', 'p5', 'ismael');
		yield* graphDB.addEdge('isaac', 'p6', 'esaw');
		yield* graphDB.addEdge('jacob', 'p7', 'simon');
		var res = yield* graphDB.findCommonAncestor('simon', 'ismael');
		assert.equal(res.node, 'abraham');
```

should handle the case where there are also common descendants.

```js
function* (){
		yield* createGraph(30);
		var res = yield* graphDB.findCommonAncestor(4, 6);
		assert.equal(res.node, 2);
```

should return the path from the common ancestor to both nodes.

```js
function* (){
		yield* createGraph(30);
		var res = yield* graphDB.findCommonAncestor(8, 10);
		assert.equal(res.node, 2);
		assert.deepEqual(res.p1, [{l:'2', n:'4'}, {l:'2', n:'8'}]);
		assert.deepEqual(res.p2, [{l:'5', n:'10'}]);
```

<a name="dummygraphdb-findpathx-y-cberr-path"></a>
## .findPath(x, y, cb(err, path))
should return the labels along the edges from x to y.

```js
function* (){
	    yield* createGraph(30);
	    var path = yield* graphDB.findPath(3, 24);
	    var m = 1;
	    for(var i = 0; i < path.length; i++) {
		m *= path[i];
	    }
	    assert.equal(m, 8); // 24 / 3
```

should always take the shortest path.

```js
function* (){
		yield* graphDB.addEdge('a', 'wrong1', 'b');
		yield* graphDB.addEdge('b', 'wrong2', 'c');
		yield* graphDB.addEdge('a', 'right', 'c');
		var path = yield* graphDB.findPath('a', 'c');
		assert.deepEqual(path, ['right']);
```

should handle directed cycles correctly.

```js
function* (){
	    yield* graphDB.addEdge('a', 'right1', 'b');
	    yield* graphDB.addEdge('b', 'right2', 'c');
	    yield* graphDB.addEdge('c', 'wrong', 'b');
	    yield* graphDB.addEdge('c', 'right3', 'd');
	    var path = yield* graphDB.findPath('a', 'd');
	    assert.deepEqual(path, ['right1', 'right2', 'right3']);
```

<a name="dummykeyvaluestore"></a>
# DummyKeyValueStore
should retrieve stored values.

```js
function* (){
	var kvs = new vercast.DummyKeyValueStore();
	yield* kvs.store('foo', 'bar');
	assert.equal(yield* kvs.fetch('foo'), 'bar');
```

<a name="dummyobjectstore"></a>
# DummyObjectStore
<a name="dummyobjectstore-inittype-args"></a>
## .init(type, args)
should return a version ID of a newly created object.

```js
function* (done){
	    var called = false;
	    var dispMap = {
		foo: {
		    init: function*() {
			called = true;
		    },
		},
	    };
	    var ostore = createOStore(dispMap);
	    var v = yield* ostore.init('foo', {});
	    assert.equal(typeof v.$, 'string');
	    assert(called, 'The constructor should have been called');
```

<a name="dummyobjectstore-transv-p-u---v-r-eff"></a>
## .trans(v, p, u) -> {v, r, eff}
should return the value returned from the method corresponding to patch p.

```js
function* (done){
	    var dispMap = {
		foo: {
		    init: function*() {
			this.baz = 0;
		    },
		    bar: function*() {
			yield sleep(1);
			this.baz += 1;
			return this.baz;
		    },
		},
	    };
	    var ostore = createOStore(dispMap);
	    var v = yield* ostore.init('foo', {});
	    var pair = yield* ostore.trans(v, {_type: 'bar'});
	    assert.equal(pair.r, 1);
	    pair = (yield* ostore.trans(pair.v, {_type: 'bar'}));
	    assert.equal(pair.r, 2);
```

should pass the patch and u flag as parameters to the called method.

```js
function* (done){
	    var dispMap = {
		foo: {
		    init: function*() {
			this.baz = 0;
		    },
		    bar: function*(ctx, p, u) {
			var amount = p.amount;
			if(u) amount = -amount;
			this.baz += amount;
			return this.baz;
		    },
		},
	    };
	    var ostore = createOStore(dispMap);
	    var v = yield* ostore.init('foo', {});
	    var pair = yield* ostore.trans(v, {_type: 'bar', amount: 3});
	    assert.equal(pair.r, 3);
	    pair = yield* ostore.trans(pair.v, {_type: 'bar', amount: 2}, true);
	    assert.equal(pair.r, 1);
```

should replace the object with another if replaced with its ID.

```js
function* (){
	    var dispMap = {
		foo:{
		    init: function*() {},
		    changeToBar: function*(ctx) {
			this._replaceWith(yield* ctx.init('bar', {}));
		    },
		},
		bar:{
		    init: function*() {},
		    query: function*() { return 555; },
		},
	    };
	    var ostore = createOStore(dispMap);
	    var v = yield* ostore.init('foo', {});
	    var res = yield* ostore.trans(v, {_type: 'changeToBar'});
	    res = yield* ostore.trans(res.v, {_type: 'query'});
```

<a name="dummyobjectstore-context"></a>
## context
<a name="dummyobjectstore-context-inittype-args"></a>
### .init(type, args)
should initialize an object with the given type and args and return its version ID.

```js
function* (){
		var dispMap = {
		    creator: {
			init: function*(ctx, args) {},
			create: function*(ctx, p, u) {
			    return yield* ctx.init(p.type, p.args);
			},
		    },
		    foo: {
			init: function*(ctx, args) { this.value = args.value; },
			get: function*() { return this.value; },
		    },
		};
		var ostore = createOStore(dispMap);
		var creator = yield* ostore.init('creator', {});
		var foo1 = yield* ostore.trans(creator, {_type: 'create', type: 'foo', args: {value: 3}});
		var res = yield* ostore.trans(foo1.r, {_type: 'get'});
		assert.equal(res.r, 3);
```

<a name="dummyobjectstore-context-transv-p-u---vreff"></a>
### .trans(v, p, u) -> {v,r,eff}
should transform a version and return the new version ID and result.

```js
function* (){
		var dispMap = {
		    foo: {
			init: function*(ctx, args) {
			    this.bar = yield* ctx.init('bar', {});
			},
			add: function*(ctx, p, u) {
			    var pair = yield* ctx.trans(this.bar, p, u);
			    this.bar = pair.v;
			    return pair.r;
			},
		    },
		    bar: {
			init: function*() {
			    this.value = 0;
			},
			add: function*(ctx, p, u) {
			    this.value += (u?-1:1) * p.amount;
			    return this.value;
			},
		    },
		};
		var ostore = createOStore(dispMap);
		var foo = yield* ostore.init('foo', {});
		var pair = yield* ostore.trans(foo, {_type: 'add', amount: 3});
		assert.equal(pair.r, 3);
		pair = yield* ostore.trans(pair.v, {_type: 'add', amount: 2}, true);
		assert.equal(pair.r, 1);
```

<a name="dummyobjectstore-context-conflictmsg"></a>
### .conflict(msg)
should throw an exception with .isConflict set to true.

```js
function* (){
		var dispMap = {
		    foo: {
			init: function*() {},
			raise: function*(ctx, p, u) { ctx.conflict('foo raises a conflict'); },
		    },
		};
		var ostore = createOStore(dispMap);
		var foo = yield* ostore.init('foo', {});
		try {
		    yield* ostore.trans(foo, {_type: 'raise'});
		    assert(false, 'should not be here');
		} catch(e) {
		    if(!e.isConflict) {
			throw e;
		    }
		}
```

<a name="dummyobjectstore-context-effectp"></a>
### .effect(p)
should add patch p to the effect sequence.

```js
function* (){
		var dispMap = {
		    foo: {
			init: function*() {},
			eff: function*(ctx, p, u) {
			    yield* ctx.effect(p.patch);
			},
		    },
		};
		var ostore = createOStore(dispMap);
		var foo = yield* ostore.init('foo', {});
		var res = yield* ostore.trans(foo, {_type: 'eff', patch: {p:123}}, false);
		var seqStore = ostore.getSequenceStore();
		yield* seqStore.append(res.eff);
		assert(!seqStore.isEmpty(), 'sequence should contain an element');
		assert.deepEqual(yield* seqStore.shift(), {p:123});
```

should add patches to the effect set even when called from a nested transformation.

```js
function* (){
		var dispMap = {
		    foo: {
			init: function*(ctx) { this.bar = yield* ctx.init('bar', {}); },
			eff: function*(ctx, p, u) {
			    yield* ctx.effect({p:333});
			    this.bar = (yield* ctx.trans(this.bar, p, u)).v;
			},
		    },
		    bar: {
			init: function*() {},
			eff: function*(ctx, p, u) {
			    yield* ctx.effect(p.patch);
			},
		    },
		};
		var ostore = createOStore(dispMap);
		var foo = yield* ostore.init('foo', {});
		var res = yield* ostore.trans(foo, {_type: 'eff', patch: {p:123}}, false);
		var seqStore = ostore.getSequenceStore();
		yield* seqStore.append(res.eff);
		assert.deepEqual(yield* seqStore.shift(), {p:333});
		assert.deepEqual(yield* seqStore.shift(), {p:123});
```

<a name="dummyobjectstore-context-self"></a>
### .self()
should return the version ID of the object prior to this patch application.

```js
function* (){
		var dispMap = {
		    foo: {
			init: function*() { this.value = 44; },
			bar: function*(ctx, p, u) {
			    this.value = 999;
			    return yield* ctx.trans(ctx.self(), {_type: 'baz'});
			},
			baz: function*(ctx, p, u) {
			    return this.value;
			},
		    },
		};
		var ostore = createOStore(dispMap);
		var foo = yield* ostore.init('foo', {});
		var res = yield* ostore.trans(foo, {_type: 'bar'});
```

<a name="dummyobjectstore-addtranslistenerhandlerv1-p-u-v2-r-eff"></a>
## .addTransListener(handler(v1, p, u, v2, r, eff))
should call the handler on each successful call to trans().

```js
function* (){
	    var dispMap = {
		foo: {
		    init: function*() { this.value = 0; },
		    bar: function*(ctx) { this.value += 1;
					  yield* ctx.effect({a:1});
					  return 99;},
		},
	    };
	    var ostore = createOStore(dispMap);
	    var called = false;
	    var foo;
	    var v2_out, eff_out;
	    ostore.addTransListener(function*(v1, p, u, v2, r, eff) {
		called = true;
		assert.equal(v1.$, foo.$);
		assert.deepEqual(p, {_type: 'bar', x: 2});
		assert.equal(u, false);
		v2_out = v2;
		assert.equal(r, 99);
		eff_out = eff;
	    });
	    foo = yield* ostore.init('foo', {});
	    var res = yield* ostore.trans(foo, {_type: 'bar', x: 2}, false);
	    assert(called, 'handler should have been called');
	    assert.equal(v2_out.$, res.v.$);

	    var seq = ostore.getSequenceStore();
	    yield* seq.append(eff_out);
	    assert.deepEqual(yield* seq.shift(), {a:1});
```

<a name="eventuallyconsistentkvs"></a>
# EventuallyConsistentKVS
<a name="eventuallyconsistentkvs-newkeykey-value"></a>
## .newKey(key, value)
should store a new key/value pair given that the method is called only once for that key.

```js
function* (){
	    yield* kvs.newKey('foo', 'bar');
```

<a name="eventuallyconsistentkvs-retrievekey"></a>
## .retrieve(key)
should return a previously-assigned value of the key, or undefined the value has not yet been regiested.

```js
function* (){
	    yield* kvs.newKey('foo', 'bar');
	    var value;
	    while(!value) {
		value = yield* kvs.retrieve('foo');
		yield function(_) { setTimeout(_, 1); };
	    }
	    assert.equal(value, 'bar');
```

<a name="eventuallyconsistentkvs-modifykey-value"></a>
## .modify(key, value)
should change the value so that it eventually becomes the given one.

```js
function* (){
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
```

<a name="inv"></a>
# $inv
should unapply the underlying patch.

```js
function* (){
	var dispMap = {
	    $inv: vercast.$inv,
	    counter: {
		init: function*() {this.value = 0;},
		add: function*(ctx, p, u) {
		    this.value += (u?-1:1) * p.amount;
		    return this.value;
		},
	    },
	};
	var ostore = createOStore(dispMap);
	var v = yield* ostore.init('counter', {});
	var res = yield* ostore.trans(v, {_type: 'inv', 
					  patch: {_type: 'add',
						  amount: 2}});
	assert.equal(res.r, -2);
```

<a name="mergingobjectstore"></a>
# MergingObjectStore
<a name="mergingobjectstore-inittype-args"></a>
## .init(type, args)
should return a new version ID.

```js
function* (){
	    var v = yield* ostore.init('atom', {value: 'a'});
	    assert.equal((yield* ostore.trans(v, {_type: 'get'})).r, 'a');
```

<a name="mergingobjectstore-transv-p---vr"></a>
## .trans(v, p) -> {v,r}
should apply a patch to the state.

```js
function* (){
	    var v = yield* ostore.init('atom', {value: 'a'});
	    assert.equal((yield* ostore.trans(v, {_type: 'get'})).r, 'a');
	    v = (yield* ostore.trans(v, {_type: 'set', from: 'a', to: 'b'})).v;
	    assert.equal((yield* ostore.trans(v, {_type: 'get'})).r, 'b');
```

<a name="mergingobjectstore-mergev1-v2-resolvefalse-atomicfalse"></a>
## .merge(v1, v2, resolve=false, atomic=false)
should return the merged version of both v1 and v2.

```js
function* (){
	    var v = yield* ostore.init('array', {elementType: 'atom', args: {value: ''}});
	    var v1 = v;
	    v1 = (yield* ostore.trans(v1, {_type: 'set', _key: 'foo', from: '', to: 'FOO'})).v;
	    var v2 = v;
	    v2 = (yield* ostore.trans(v2, {_type: 'set', _key: 'bar', from: '', to: 'BAR'})).v;
	    var vm = yield* ostore.merge(v1, v2);
	    assert.equal((yield* ostore.trans(vm, {_type: 'get', _key: 'foo'})).r, 'FOO');
	    assert.equal((yield* ostore.trans(vm, {_type: 'get', _key: 'bar'})).r, 'BAR');
```

should record each merge so that further merges can be performed.

```js
function* (){
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
```

should fail on conflict, if resolve === false or omitted.

```js
function* (){
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
```

should pass if resolve === true, preferring v1.

```js
function* (){
	    var v = yield* ostore.init('array', {elementType: 'atom', args: {value: ''}});
	    var v1 = v;
	    v1 = (yield* ostore.trans(v1, {_type: 'set', _key: 'foo', from: '', to: 'FOO1'})).v;
	    var v2 = v;
	    v2 = (yield* ostore.trans(v2, {_type: 'set', _key: 'foo', from: '', to: 'FOO2'})).v;
	    var vm = yield* ostore.merge(v1, v2, true);
	    assert.equal((yield* ostore.trans(vm, {_type: 'get', _key: 'foo'})).r, 'FOO1');
```

should record the merge in such a way that will preserve the resolution decisions.

```js
function* (){
	    var v = yield* ostore.init('array', {elementType: 'atom', args: {value: ''}});
	    var v1 = v;
	    v1 = (yield* ostore.trans(v1, {_type: 'set', _key: 'foo', from: '', to: 'FOO1'})).v;
	    var v2 = v;
	    v2 = (yield* ostore.trans(v2, {_type: 'set', _key: 'foo', from: '', to: 'FOO2'})).v;
	    var vm = yield* ostore.merge(v1, v2, true);
	    v2 = (yield* ostore.trans(v2, {_type: 'set', _key: 'bar', from: '', to: 'BAR'})).v;
	    var vm2 = yield* ostore.merge(v2, vm, false); // should not be conflicting
	    assert.equal((yield* ostore.trans(vm2, {_type: 'get', _key: 'foo'})).r, 'FOO1');
```

should record each patch by itself when atomic is false or omitted.

```js
function* (){
	    var v = yield* ostore.init('array', {elementType: 'atom', args: {value: ''}});
	    var v1 = v;
	    v1 = (yield* ostore.trans(v1, {_type: 'set', _key: 'foo', from: '', to: 'FOO1'})).v;
	    var v2 = v;
	    v2 = (yield* ostore.trans(v2, {_type: 'set', _key: 'foo', from: '', to: 'FOO2'})).v;
	    v2 = (yield* ostore.trans(v2, {_type: 'set', _key: 'bar', from: '', to: 'BAR'})).v;
	    var vm = yield* ostore.merge(v1, v2, true);
	    assert.equal((yield* ostore.trans(vm, {_type: 'get', _key: 'foo'})).r, 'FOO1');
	    assert.equal((yield* ostore.trans(vm, {_type: 'get', _key: 'bar'})).r, 'BAR');
```

should bundle all patches contributed by a merge in a single transaction, if atomic is true.

```js
function* (){
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
```

<a name="objectdispatcher"></a>
# ObjectDispatcher
<a name="objectdispatcher-inittype-args"></a>
## .init(type, args)
should return an instance of the referenced type, after calling the init() function associated with the type.

```js
function* (){
	    var disp = new vercast.ObjectDispatcher({foo: {
		init: function*(ctx, args) {
		    this.bar = 2;
		    this.ctx = ctx;
		    this.baz = args.baz;
		}
	    }
						    });
	    var ctx = 777;
	    var obj = yield* disp.init(ctx, 'foo', {baz: 123});
	    assert.equal(obj._type, 'foo');
	    assert.equal(obj.bar, 2);
	    assert.equal(obj.ctx, ctx);
	    assert.equal(obj.baz, 123);
```

<a name="objectdispatcher-applyctx-obj-patch-unapply"></a>
## .apply(ctx, obj, patch, unapply)
should call a method corresponding to patch._type.

```js
function* (done){
	    var disp = new vercast.ObjectDispatcher({
		foo: {
		    init: function*(ctx, args) {},
		    bar: function*() {this.bar = 2;
				      return ctx + 1;},
		}
	    });
	    var ctx = 777;
	    var obj = yield* disp.init(ctx, 'foo');
	    var res = yield* disp.apply(ctx, obj, {_type: 'bar'});
	    assert.equal(obj.bar, 2);
	    assert.equal(res, 778);
```

should call a patch handler function if one exists in the map.

```js
function* (){
	    var called = false;
	    var disp = new vercast.ObjectDispatcher({
		foo: {
		    init: function*() { this.value = 2; },
		},
		$bar: function*(ctx, p, u) {
		    called = true;
		    assert.equal(p.a, 3);
		    assert.equal(this.value, 2);
		},
	    });
	    var ctx = 777;
	    var foo = yield* disp.init(ctx, 'foo');
	    var res = yield* disp.apply(ctx, foo, {_type: 'bar', a:3});
	    assert(called, 'patch handler should have been called');
```

should prefer the object method when both a method and a handler are defined.

```js
function* (){
	    var called = false;
	    var disp = new vercast.ObjectDispatcher({
		foo: {
		    init: function*() { this.value = 2; },
		    bar: function*() {
			called = true;
		    },
		},
		$bar: function*() {
		    assert(false, 'The handler should not have been called');
		},
	    });
	    var ctx = 777;
	    var foo = yield* disp.init(ctx, 'foo');
	    var res = yield* disp.apply(ctx, foo, {_type: 'bar', a:3});
	    assert(called, 'patch method should have been called');
```

should call the object's _default() method if it exists and a specific handler is not defined.

```js
function* (){
	    var called;
	    var dispMap = {
		foo: {
		    init: function*() {},
		    _default: function*() { called = true; },
		},
	    };
	    var  disp = new vercast.ObjectDispatcher(dispMap);
	    var ctx = {};
	    var foo = yield* disp.init(ctx, 'foo', {});
	    yield* disp.apply(ctx, foo, {_type: 'somethingThatDoesNotExist'});
	    assert(called, '_default should have been called');
```

should prefer a class method over _default.

```js
function* (){
	    var barCalled = false;
	    var defaultCalled = false;
	    var dispMap = {
		foo: {
		    init: function*() {},
		    bar: function*() { barCalled = true; },
		    _default: function*() { defaultCalled = true; },
		},
	    };
	    var  disp = new vercast.ObjectDispatcher(dispMap);
	    var ctx = {};
	    var foo = yield* disp.init(ctx, 'foo', {});
	    yield* disp.apply(ctx, foo, {_type: 'bar'});
	    assert(!defaultCalled, '_default should not have been called');
	    assert(barCalled, 'bar should not have been called');
```

should prefer a generic handler over _default.

```js
function* (){
	    var barCalled = false;
	    var defaultCalled = false;
	    var dispMap = {
		foo: {
		    init: function*() {},
		    _default: function*() { defaultCalled = true; },
		},
		$bar: function*() { barCalled = true; },
	    };
	    var  disp = new vercast.ObjectDispatcher(dispMap);
	    var ctx = {};
	    var foo = yield* disp.init(ctx, 'foo', {});
	    yield* disp.apply(ctx, foo, {_type: 'bar'});
	    assert(!defaultCalled, '_default should not have been called');
	    assert(barCalled, 'bar should not have been called');
```

<a name="objectmonitor"></a>
# ObjectMonitor
<a name="objectmonitor-proxy"></a>
## .proxy()
should allow modifying an object through a proxy.

```js
var obj = {a:1, b:2};
var monitor = new vercast.ObjectMonitor(obj);
var proxy = monitor.proxy();
assert.equal(proxy.a, 1);
proxy.a = 3;
assert.equal(obj.a, 3);
```

should wrap objects (including arrays) with map proxies.

```js
var obj = {a:1, b:2};
var monitor = new vercast.ObjectMonitor(obj);
var proxy = monitor.proxy();
proxy.a = [1, 2, 3];
assert.throws(function() {
		proxy.a[0] = 4;
}, /Can't add property 0, object is not extensible/);
```

should provide access to child object fields via get/put methods, that update the dirty flag.

```js
var obj = {a:1, b:2};
var monitor = new vercast.ObjectMonitor(obj);
var proxy = monitor.proxy();
assert(!monitor.isDirty(), 'should not be dirty');
proxy.a = [1, 2, 3];
assert(monitor.isDirty(), 'should be dirty after adding updating a to an array');
assert(!monitor.isDirty(), 'dirty flag should have been reset');
assert.equal(proxy.a.get(1), 2);
proxy.a.put(2, 5);
assert(monitor.isDirty(), 'should be dirty after updating the value');
assert.equal(proxy.a.get(2), 5);
```

should retain the original object as a simple, JSON-style object.

```js
var obj = {a:1, b:2};
var monitor = new vercast.ObjectMonitor(obj);
var proxy = monitor.proxy();
proxy.a = [1, 2, 3];
assert.deepEqual(obj, {a:[1, 2, 3], b:2});
proxy.a.put(2, 4);
assert.deepEqual(obj, {a:[1, 2, 4], b:2});
```

should use map proxies recursively.

```js
var obj = {a:1, b:2};
var monitor = new vercast.ObjectMonitor(obj);
var proxy = monitor.proxy();
proxy.a = [1, 2, 3];
proxy.a.put(2, {x:1, y: 2});
assert.throws(function() {
		proxy.a.get(2).x = 3;
}, /Can't add property x, object is not extensible/);
assert.equal(proxy.a.get(2).get('x'), 1);
monitor.isDirty(); // reset the dirty flag
proxy.a.get(2).put('x', 4);
assert(monitor.isDirty(), 'should be dirty now');
assert.equal(proxy.a.get(2).get('x'), 4);
```

should return an unextensible proxy object.

```js
var obj = {a:1, b:2};
var monitor = new vercast.ObjectMonitor(obj);
var proxy = monitor.proxy();
assert.throws(function() {
		proxy.c = 4;
}, /Can't add property c, object is not extensible/);
```

should not provide a map proxy for id-like objects.

```js
var obj = {a:1, b:2};
var monitor = new vercast.ObjectMonitor(obj);
var proxy = monitor.proxy();
proxy.a = {$:'abc'};
assert.equal(proxy.a.$, 'abc');
```

should not provide a map proxy for id-like nested objects.

```js
var obj = {a:1, b:2, c: {$:'abc'}};
var monitor = new vercast.ObjectMonitor(obj);
var proxy = monitor.proxy();
proxy.b = [1, 2, 3];
proxy.b.put(1, {$:'efg'});
assert.equal(proxy.b.get(1).$, 'efg');
assert.equal(proxy.c.$, 'abc');
```

<a name="objectmonitor-proxy-_replacewithobj"></a>
### ._replaceWith(obj)
should replace the underlying object with the given one.

```js
var obj = {a:1, b:2};
var monitor = new vercast.ObjectMonitor(obj);
var proxy = monitor.proxy();
assert.equal(monitor.json(), '{"a":1,"b":2}');
proxy._replaceWith({x:1, y:2});
var proxy2 = monitor.proxy();
assert.equal(proxy2.x, 1);
assert.equal(monitor.json(), '{"x":1,"y":2}');
```

<a name="objectmonitor-isdirty"></a>
## .isDirty()
should indicate if a change to the object has been made since the last time it has been called.

```js
var obj = {a:1, b:2};
var monitor = new vercast.ObjectMonitor(obj);
var proxy = monitor.proxy();
assert(!monitor.isDirty(), 'monitor should not be dirty yet');
proxy.a = 3;
assert(monitor.isDirty(), 'monitor should now be dirty');
assert(!monitor.isDirty(), 'monitor should not be dirty anymore');
```

<a name="objectmonitor-hash"></a>
## .hash()
should return a unique string representing the content of the object.

```js
var obj = {a:1, b:2};
var monitor = new vercast.ObjectMonitor(obj);
var proxy = monitor.proxy();
proxy.a = [1, 2, 3];
var hash1 = monitor.hash();
assert.equal(typeof hash1, 'string');
proxy.a.put(0, 4);
var hash2 = monitor.hash();
assert.notEqual(hash1, hash2);
proxy.a.put(0, 1);
var hash3 = monitor.hash();
assert.equal(hash3, hash1);
```

should work regardless of dirty testing.

```js
var obj = {a:1, b:2};
var monitor = new vercast.ObjectMonitor(obj);
var proxy = monitor.proxy();
proxy.a = [1, 2, 3];
var hash1 = monitor.hash();
assert.equal(typeof hash1, 'string');
proxy.a.put(0, 4);
monitor.isDirty();
var hash2 = monitor.hash();
assert.notEqual(hash1, hash2);
```

<a name="objectmonitor-sealobj-static"></a>
## .seal(obj) [static]
should make the given object unmodifiable.

```js
var obj = {a:1, b:2};
vercast.ObjectMonitor.seal(obj);
assert.throws(function() {
		obj.a = 3;
}, /Cannot assign to read only property/);
```

should place the object's hash as the $ property of the object.

```js
var hash1 = new vercast.ObjectMonitor({a:1, b:2}).hash();
var obj = {a:1, b:2};
vercast.ObjectMonitor.seal(obj);
assert.equal(obj.$, hash1);
```

should return the hash.

```js
var obj = {a:1, b:2};
var hash1 = vercast.ObjectMonitor.seal(obj);
assert.equal(obj.$, hash1);
```

should allow an object to be sealed multiple times.

```js
var obj = {a:1, b:2};
var hash1 = vercast.ObjectMonitor.seal(obj);
var hash2 = vercast.ObjectMonitor.seal(obj);
assert.equal(hash1, hash2);
```

<a name="objectmonitor-revision"></a>
## .revision()
should return the object's revision number, one that icrements with each change.

```js
var obj = {a:1, b:2};
var monitor = new vercast.ObjectMonitor(obj);
var proxy = monitor.proxy();
assert.equal(monitor.revision(), 0);
proxy.a = [1, 2, 3];
assert.equal(monitor.revision(), 1);
proxy.a.put(0, 3);
assert.equal(monitor.revision(), 2);
```

<a name="objectmonitor-json"></a>
## .json()
should return a JSON representation of the object.

```js
var obj = {a:1, b:2};
var monitor = new vercast.ObjectMonitor(obj);
var proxy = monitor.proxy();
proxy.a = [1, 2, 3];
assert.equal(monitor.json(), '{"a":[1,2,3],"b":2}');
```

<a name="objectmonitor-object"></a>
## .object()
should provide an unprovisioned access to the object.

```js
var obj = {a:1, b:2};
var monitor = new vercast.ObjectMonitor(obj);
var obj2 = monitor.object();
assert.equal(obj2.a, 1);
```

<a name="objecttestbed"></a>
# ObjectTestBed
<a name="objecttestbed-transp"></a>
## .trans(p)
should apply a patch, returning the result.

```js
function* (){
	    var dispMap = {
		counter: {
		    init: function*() {this.value = 0;},
		    add: function*(ctx, p, u) {
			this.value += (u?-1:1) * p.amount;
			return this.value;
		    },
		},
	    };
	    var otb = new vercast.ObjectTestBed(dispMap, 'counter', {});
	    var r = yield* otb.trans({_type: 'add', amount: 2});
	    assert.equal(r, 2);
	    r = yield* otb.trans({_type: 'add', amount: 3});
	    assert.equal(r, 5);
```

<a name="objecttestbed-transp-reversibilitychecker"></a>
### reversibilityChecker
should fail for non-reversible transformations.

```js
function* (){
		var dispMap = {
		    badCounter: {
			init: function*() {this.value = 0;},
			add: function*(ctx, p, u) {
			    this.value += p.amount; // ignoring u
			    return this.value;
			},
		    },
		};
		var otb = new vercast.ObjectTestBed(dispMap, 'badCounter', {});
		try {
		    yield* otb.trans({_type: 'add', amount: 2});
		    assert(false, 'error is expected');
		} catch(e) {
		    assert.equal(e.message, 'Transformation "add" for type "badCounter" is not reversible');
		}
```

should consult a digest() method (if defined) to get a representation of the value.

```js
function* (){
		var dispMap = {
		    counter: {
			init: function*() {
			    this.value = 0;
			    this.generation = 0;
			},
			add: function*(ctx, p, u) {
			    this.value += (u?-1:1) * p.amount;
			    this.generation += 1; // This is not reversible
			    return this.value;
			},
			digest: function*() {
			    return this.value; // only the value matters
			},
		    },
		};
		var otb = new vercast.ObjectTestBed(dispMap, 'counter', {});
		var r = yield* otb.trans({_type: 'add', amount: 2});
		assert.equal(r, 2);
		r = yield* otb.trans({_type: 'add', amount: 3});
		assert.equal(r, 5);
```

<a name="objecttestbed-transp-commutativitychecker"></a>
### commutativityChecker
should fail for independent transformations that do not commute.

```js
function* (){
		var dispMap = {
		    badCounter: {
			init: function*() {this.value = 0;},
			add: function*(ctx, p, u) {
			    this.value += (u?-1:1) * p.amount;
			    return this.value;
			},
			mult: function*(ctx, p, u) {
			    if(u) {
				this.value /= p.amount;
			    } else {
				this.value *= p.amount;
			    }
			    return this.value;
			},
		    },
		};
		var otb = new vercast.ObjectTestBed(dispMap, 'badCounter', {});
		yield* otb.trans({_type: 'add', amount: 2});
		try {
		    yield* otb.trans({_type: 'mult', amount: 3});
		    assert(false, 'error is expected');
		} catch(e) {
		    assert.equal(e.message, 'Transformations "add" and "mult" for type "badCounter" are independent but do not commute');
		}
```

should not fail when the transformations are not independent.

```js
function* (){
		var dispMap = {
		    atom: {
			init: function*(ctx, args) { this.value = args.value; },
			change: function*(ctx, p, u) {
			    var from = u ? p.to : p.from;
			    var to = u ? p.from : p.to;
			    if(this.value !== from) {
				ctx.conflict('Expected: ' + from + ' found: ' + this.value);
			    }
			    this.value = to;
			},
		    },
		};
		var otb = new vercast.ObjectTestBed(dispMap, 'atom', {value: 'a'});
		yield* otb.trans({_type: 'change', from: 'a', to: 'b'});
		yield* otb.trans({_type: 'change', from: 'b', to: 'c'});
```

should fail when for independent p1 and p2, one permutation conflicts.

```js
function* (){
		var dispMap = {
		    badAtom: {
			init: function*(ctx, args) { this.value = args.value; },
			change: function*(ctx, p, u) {
			    var from = u ? p.to : p.from;
			    var to = u ? p.from : p.to;
			    if(this.value > from) {
				ctx.conflict('Expected: ' + from + ' found: ' + this.value);
			    }
			    this.value = to;
			},
		    },
		};
		var otb = new vercast.ObjectTestBed(dispMap, 'badAtom', {value: 0});
		yield* otb.trans({_type: 'change', from: 0, to: 1});
		try {
		    yield* otb.trans({_type: 'change', from: 1, to: 2});
		    assert(false, 'previous statement should fail');
		} catch(e) {
		    assert.equal(e.message, 'Transformations "change" and "change" for type "badAtom" are independent but do not commute');
		}
```

should fail on non-commutative independent patches even if p1 and p2 are not following one anotherp.

```js
function* (){
		var dispMap = {
		    badAtom: {
			init: function*(ctx, args) { this.value = args.value; },
			change: function*(ctx, p, u) {
			    var from = u ? p.to : p.from;
			    var to = u ? p.from : p.to;
			    if(this.value > from) {
				ctx.conflict('Expected: ' + from + ' found: ' + this.value);
			    }
			    this.value = to;
			},
			get: function*() {
			    return this.value;
			},
		    },
		};
		var otb = new vercast.ObjectTestBed(dispMap, 'badAtom', {value: 0});
		yield* otb.trans({_type: 'change', from: 0, to: 1});
		assert.equal(yield* otb.trans({_type: 'get'}), 1);
		try {
		    yield* otb.trans({_type: 'change', from: 1, to: 2});
		    assert(false, 'previous statement should fail');
		} catch(e) {
		    assert.equal(e.message, 'Transformations "change" and "change" for type "badAtom" are independent but do not commute');
		}
```

should consult a digest() method (if exists) to determine version equivalence.

```js
function* (){
		var dispMap = {
		    counter: {
			init: function*() {
			    this.value = 0;
			    this.history = '';
			},
			add: function*(ctx, p, u) {
			    this.value += (u?-1:1) * p.amount;
			    if(!u) {
				this.history = this.history + ':' + this.value;
			    } else {
				this.history = this.history.substr(0, this.history.length - 1 - ('' + this.value).length);
			    }
			    return this.value;
			},
			digest: function*(ctx, p, u) {
			    return this.value;
			},
		    },
		};
		var otb = new vercast.ObjectTestBed(dispMap, 'counter', {});
		var r = yield* otb.trans({_type: 'add', amount: 2});
		assert.equal(r, 2);
		r = yield* otb.trans({_type: 'add', amount: 3});
		assert.equal(r, 5);
```

<a name="rootstore"></a>
# RootStore
<a name="rootstore-inittype-args"></a>
## .init(type, args)
should return an initial version ID of a new object.

```js
function* (){
	    var called = false;
	    var dispMap = {
		foo: {
		    init: function*() { called = true; },
		},
	    };
	    var rootStore = new vercast.RootStore(createOStore(dispMap));
	    var v = yield* rootStore.init('foo', {});
	    assert(called, 'constructor should have been called');
```

<a name="rootstore-transv-p-u---vr"></a>
## .trans(v, p, u) -> {v,r}
should call a patch method and return its returned value.

```js
function* (){
	    var dispMap = {
		counter: {
		    init: function*() { this.value = 0; },
		    add: function*(ctx, p, u) {
			this.value += (u?-1:1) * p.amount;
			return this.value;
		    },
		},
	    };
	    var rootStore = new vercast.RootStore(createOStore(dispMap));
	    var v = yield* rootStore.init('counter', {});
	    var pair = yield* rootStore.trans(v, {_type: 'add', amount: 2});
	    assert.equal(pair.r, 2);
	    pair = yield* rootStore.trans(pair.v, {_type: 'add', amount: 3}, true);
	    assert.equal(pair.r, -1);
```

should apply the effect set internally.

```js
function* (){
	    var dispMap = {
		dir: {
		    init: function*(ctx, args) {
			this.foo = yield* ctx.init('foo', {});
			this.bar = yield* ctx.init('bar', {});
		    },
		    apply: function*(ctx, p, u) {
			var pair = yield* ctx.trans(this[p.name], p.patch, u);
			this[p.name] = pair.v;
			return pair.r;
		    },
		},
		foo: {
		    init: function*() { this.foo = 0; },
		    inc: function*(ctx, p, u) {
			this.foo += (u?-1:1);
			return this.foo;
		    },
		},
		bar: {
		    init: function*() { },
		    incFoo: function*(ctx, p, u) {
			yield* ctx.effect({_type: 'apply', name: 'foo', patch: {_type: 'inc'}});
		    },
		},
	    };
	    var rootStore = new vercast.RootStore(createOStore(dispMap));
	    var v = yield* rootStore.init('dir', {});
	    var pair = yield* rootStore.trans(v, {_type: 'apply', 
						  name: 'bar', 
						  patch: {_type: 'incFoo'}});
	    pair = yield* rootStore.trans(pair.v, {_type: 'apply',
						   name: 'foo',
						   patch: {_type: 'inc'}});
	    assert.equal(pair.r, 2);
```

should return the return value of the original patch.

```js
function* (){
	    var dispMap = {
		foo: {
		    init: function*() {},
		    bar: function*(ctx) {
			yield* ctx.effect({_type: 'baz'});
			return 1;
		    },
		    baz: function*() {
			return 2;
		    },
		}
	    };
	    var rootStore = new vercast.RootStore(createOStore(dispMap));
	    var v = yield* rootStore.init('foo', {});
	    var res = yield* rootStore.trans(v, {_type: 'bar'});
	    assert.equal(res.r, 1);
```

<a name="sequencestorefactory"></a>
# SequenceStoreFactory
<a name="sequencestorefactory-createsequencestore"></a>
## .createSequenceStore()
should return a new sequence store.

```js
var seqStore = factory.createSequenceStore();
assert.equal(typeof seqStore, 'object');
```

<a name="sequencestorefactory-createsequencestore-appendobj"></a>
### .append(obj)
should append an object to a sequence.

```js
function* (){
		var seqStore = factory.createSequenceStore();
		yield* seqStore.append({a:1});
		yield* seqStore.append({a:2});
```

should append an entire sequence if given its hash.

```js
function* (){
		var seqStore1 = factory.createSequenceStore();
		yield* seqStore1.append({a:1});
		yield* seqStore1.append({a:2});

		var seqStore2 = factory.createSequenceStore();
		yield* seqStore2.append(yield* seqStore1.hash());
		yield* seqStore2.append({a:3});
		
		assert.deepEqual(yield* seqStore2.shift(), {a:1});
		assert.deepEqual(yield* seqStore2.shift(), {a:2});
		assert.deepEqual(yield* seqStore2.shift(), {a:3});
```

should append a sequence consisting of a single object when given its hash.

```js
function* (){
		var seqStore1 = factory.createSequenceStore();
		yield* seqStore1.append({a:2});

		var seqStore2 = factory.createSequenceStore();
		yield* seqStore2.append({a:1});
		yield* seqStore2.append(yield* seqStore1.hash());
		yield* seqStore2.append({a:3});
		
		assert.deepEqual(yield* seqStore2.shift(), {a:1});
		assert.deepEqual(yield* seqStore2.shift(), {a:2});
		assert.deepEqual(yield* seqStore2.shift(), {a:3});
```

<a name="sequencestorefactory-createsequencestore-isempty"></a>
### .isEmpty()
should indicate if the sequence is empty.

```js
function* (){
		var seqStore = factory.createSequenceStore();
		assert(seqStore.isEmpty(), 'should be empty');
		yield* seqStore.append({a:1});
		assert(!seqStore.isEmpty(), 'should not be empty anymore');
```

<a name="sequencestorefactory-createsequencestore-shift"></a>
### .shift()
should remove the first element from the sequence and return it.

```js
function* (){
		var seqStore = factory.createSequenceStore();
		yield* seqStore.append({a:1});
		yield* seqStore.append({a:2});
		assert.deepEqual(yield* seqStore.shift(), {a:1});
		assert.deepEqual(yield* seqStore.shift(), {a:2});
		assert(seqStore.isEmpty());
```

<a name="sequencestorefactory-createsequencestore-pop"></a>
### .pop()
should remove the last element from the sequence and return it.

```js
function* (){
		var seqStore = factory.createSequenceStore();
		yield* seqStore.append({a:1});
		yield* seqStore.append({a:2});
		assert.deepEqual(yield* seqStore.pop(), {a:2});
		assert.deepEqual(yield* seqStore.pop(), {a:1});
		assert(seqStore.isEmpty());
```

<a name="sequencestorefactory-createsequencestore-hash"></a>
### .hash()
should return an empty string if the sequence is empty.

```js
function* (){
		var seqStore = factory.createSequenceStore();
		assert.equal(yield* seqStore.hash(), '');
```

should return the object hash, assuming only one object in the sequence.

```js
function* (){
		var seqStore = factory.createSequenceStore();
		yield* seqStore.append({a:1});
		assert.equal(yield* seqStore.hash(), vercast.ObjectMonitor.seal({a:1}));
```

should return a hash unique to the sequence for sequence size larger than 1.

```js
function* (){
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
```

should provide the same hash if the only element in a sequence is a hash of another sequence.

```js
function* (){
		var seqStore1 = factory.createSequenceStore();
		yield* seqStore1.append({a:1});
		yield* seqStore1.append({a:2});
		yield* seqStore1.append({a:3});
		
		var seqStore2 = factory.createSequenceStore();
		yield* seqStore2.append(yield* seqStore1.hash());
		
		assert.equal(yield* seqStore1.hash(), yield* seqStore2.hash());
```

<a name="simpleobjectstore"></a>
# SimpleObjectStore
should avoid running the patch method again if the patch has already been applied on an identical object.

```js
function* (){
	var count = 0;
	var dispMap = {
	    foo: {
		init: function*() { this.x = 0; },
		bar: function*(ctx, p, u) {
		    count += 1;
		    this.x += 1;
		},
	    },
	};
	var ostore = createOStore(dispMap);
	var v0 = yield* ostore.init('foo', {});
	var v1 = (yield* ostore.trans(v0, {_type: 'bar'})).v;
	assert.equal(count, 1);
	var v1Prime = (yield* ostore.trans(v0, {_type: 'bar'})).v;
	assert.equal(v1.$, v1Prime.$);
	// This should not 
	assert.equal(count, 1);
```

<a name="simpleobjectstore-inittype-args"></a>
## .init(type, args)
should return a version ID of a newly created object.

```js
function* (done){
	    var called = false;
	    var dispMap = {
		foo: {
		    init: function*() {
			called = true;
		    },
		},
	    };
	    var ostore = createOStore(dispMap);
	    var v = yield* ostore.init('foo', {});
	    assert.equal(typeof v.$, 'string');
	    assert(called, 'The constructor should have been called');
```

<a name="simpleobjectstore-transv-p-u---v-r-eff"></a>
## .trans(v, p, u) -> {v, r, eff}
should return the value returned from the method corresponding to patch p.

```js
function* (done){
	    var dispMap = {
		foo: {
		    init: function*() {
			this.baz = 0;
		    },
		    bar: function*() {
			yield sleep(1);
			this.baz += 1;
			return this.baz;
		    },
		},
	    };
	    var ostore = createOStore(dispMap);
	    var v = yield* ostore.init('foo', {});
	    var pair = yield* ostore.trans(v, {_type: 'bar'});
	    assert.equal(pair.r, 1);
	    pair = (yield* ostore.trans(pair.v, {_type: 'bar'}));
	    assert.equal(pair.r, 2);
```

should pass the patch and u flag as parameters to the called method.

```js
function* (done){
	    var dispMap = {
		foo: {
		    init: function*() {
			this.baz = 0;
		    },
		    bar: function*(ctx, p, u) {
			var amount = p.amount;
			if(u) amount = -amount;
			this.baz += amount;
			return this.baz;
		    },
		},
	    };
	    var ostore = createOStore(dispMap);
	    var v = yield* ostore.init('foo', {});
	    var pair = yield* ostore.trans(v, {_type: 'bar', amount: 3});
	    assert.equal(pair.r, 3);
	    pair = yield* ostore.trans(pair.v, {_type: 'bar', amount: 2}, true);
	    assert.equal(pair.r, 1);
```

should replace the object with another if replaced with its ID.

```js
function* (){
	    var dispMap = {
		foo:{
		    init: function*() {},
		    changeToBar: function*(ctx) {
			this._replaceWith(yield* ctx.init('bar', {}));
		    },
		},
		bar:{
		    init: function*() {},
		    query: function*() { return 555; },
		},
	    };
	    var ostore = createOStore(dispMap);
	    var v = yield* ostore.init('foo', {});
	    var res = yield* ostore.trans(v, {_type: 'changeToBar'});
	    res = yield* ostore.trans(res.v, {_type: 'query'});
```

<a name="simpleobjectstore-context"></a>
## context
<a name="simpleobjectstore-context-inittype-args"></a>
### .init(type, args)
should initialize an object with the given type and args and return its version ID.

```js
function* (){
		var dispMap = {
		    creator: {
			init: function*(ctx, args) {},
			create: function*(ctx, p, u) {
			    return yield* ctx.init(p.type, p.args);
			},
		    },
		    foo: {
			init: function*(ctx, args) { this.value = args.value; },
			get: function*() { return this.value; },
		    },
		};
		var ostore = createOStore(dispMap);
		var creator = yield* ostore.init('creator', {});
		var foo1 = yield* ostore.trans(creator, {_type: 'create', type: 'foo', args: {value: 3}});
		var res = yield* ostore.trans(foo1.r, {_type: 'get'});
		assert.equal(res.r, 3);
```

<a name="simpleobjectstore-context-transv-p-u---vreff"></a>
### .trans(v, p, u) -> {v,r,eff}
should transform a version and return the new version ID and result.

```js
function* (){
		var dispMap = {
		    foo: {
			init: function*(ctx, args) {
			    this.bar = yield* ctx.init('bar', {});
			},
			add: function*(ctx, p, u) {
			    var pair = yield* ctx.trans(this.bar, p, u);
			    this.bar = pair.v;
			    return pair.r;
			},
		    },
		    bar: {
			init: function*() {
			    this.value = 0;
			},
			add: function*(ctx, p, u) {
			    this.value += (u?-1:1) * p.amount;
			    return this.value;
			},
		    },
		};
		var ostore = createOStore(dispMap);
		var foo = yield* ostore.init('foo', {});
		var pair = yield* ostore.trans(foo, {_type: 'add', amount: 3});
		assert.equal(pair.r, 3);
		pair = yield* ostore.trans(pair.v, {_type: 'add', amount: 2}, true);
		assert.equal(pair.r, 1);
```

<a name="simpleobjectstore-context-conflictmsg"></a>
### .conflict(msg)
should throw an exception with .isConflict set to true.

```js
function* (){
		var dispMap = {
		    foo: {
			init: function*() {},
			raise: function*(ctx, p, u) { ctx.conflict('foo raises a conflict'); },
		    },
		};
		var ostore = createOStore(dispMap);
		var foo = yield* ostore.init('foo', {});
		try {
		    yield* ostore.trans(foo, {_type: 'raise'});
		    assert(false, 'should not be here');
		} catch(e) {
		    if(!e.isConflict) {
			throw e;
		    }
		}
```

<a name="simpleobjectstore-context-effectp"></a>
### .effect(p)
should add patch p to the effect sequence.

```js
function* (){
		var dispMap = {
		    foo: {
			init: function*() {},
			eff: function*(ctx, p, u) {
			    yield* ctx.effect(p.patch);
			},
		    },
		};
		var ostore = createOStore(dispMap);
		var foo = yield* ostore.init('foo', {});
		var res = yield* ostore.trans(foo, {_type: 'eff', patch: {p:123}}, false);
		var seqStore = ostore.getSequenceStore();
		yield* seqStore.append(res.eff);
		assert(!seqStore.isEmpty(), 'sequence should contain an element');
		assert.deepEqual(yield* seqStore.shift(), {p:123});
```

should add patches to the effect set even when called from a nested transformation.

```js
function* (){
		var dispMap = {
		    foo: {
			init: function*(ctx) { this.bar = yield* ctx.init('bar', {}); },
			eff: function*(ctx, p, u) {
			    yield* ctx.effect({p:333});
			    this.bar = (yield* ctx.trans(this.bar, p, u)).v;
			},
		    },
		    bar: {
			init: function*() {},
			eff: function*(ctx, p, u) {
			    yield* ctx.effect(p.patch);
			},
		    },
		};
		var ostore = createOStore(dispMap);
		var foo = yield* ostore.init('foo', {});
		var res = yield* ostore.trans(foo, {_type: 'eff', patch: {p:123}}, false);
		var seqStore = ostore.getSequenceStore();
		yield* seqStore.append(res.eff);
		assert.deepEqual(yield* seqStore.shift(), {p:333});
		assert.deepEqual(yield* seqStore.shift(), {p:123});
```

<a name="simpleobjectstore-context-self"></a>
### .self()
should return the version ID of the object prior to this patch application.

```js
function* (){
		var dispMap = {
		    foo: {
			init: function*() { this.value = 44; },
			bar: function*(ctx, p, u) {
			    this.value = 999;
			    return yield* ctx.trans(ctx.self(), {_type: 'baz'});
			},
			baz: function*(ctx, p, u) {
			    return this.value;
			},
		    },
		};
		var ostore = createOStore(dispMap);
		var foo = yield* ostore.init('foo', {});
		var res = yield* ostore.trans(foo, {_type: 'bar'});
```

<a name="simplequeue"></a>
# SimpleQueue
should retrieve elements in the same order they were entered.

```js
function* (){
	var queue = new vercast.SimpleQueue();
	var i;
	for(i = 0; i < 10; i++) {
	    yield* queue.enqueue(i);
	}
	for(i = 0; i < 10; i++) {
	    assert(!(yield* queue.isEmpty()), 'queue should not be empty yet');
	    var n = yield* queue.dequeue();
	    assert.equal(n, i);
	}
	assert(yield* queue.isEmpty(), 'queue should be empty');
```

<a name="simpleversiongraph"></a>
# SimpleVersionGraph
<a name="simpleversiongraph-recordtransv1-p-v2"></a>
## .recordTrans(v1, p, v2)
should return a callback with no error if all is OK.

```js
function* (){
	    yield* versionGraph.recordTrans({$:'foo'}, {_type: 'myPatch'}, {$:'bar'});
```

<a name="simpleversiongraph-getmergestrategyv1-v2"></a>
## .getMergeStrategy(v1, v2)
should return x as the common ancestor of v1 and v2.

```js
function* (){
	    var mergeInfo = yield* versionGraph.getMergeStrategy({$:18}, {$:14});
	    assert.equal(mergeInfo.x.$, 2);
```

should return either v1 or v2 as V1, and the other as V2.

```js
function* (){
	    var v1 = {$:Math.floor(Math.random() * 29) + 1};
	    var v2 = {$:Math.floor(Math.random() * 29) + 1};
	    var mergeInfo = yield* versionGraph.getMergeStrategy(v1, v2);
	    assert(mergeInfo.V1.$ == v1.$ || mergeInfo.V1.$ == v2.$, 'V1 should be either v1 or v2: ' + mergeInfo.V1.$);
	    assert(mergeInfo.V2.$ == v1.$ || mergeInfo.V2.$ == v2.$, 'V2 should be either v1 or v2: ' + mergeInfo.V2.$);
	    assert(mergeInfo.V1.$ != mergeInfo.V2.$ || v1.$ == v2.$, 'V1 and V2 should not be the same one');
```

should set V1 and V2 to be v1 and v2 respectively if resolve=true.

```js
function* (){
	    var v1 = {$:Math.floor(Math.random() * 29) + 1};
	    var v2 = {$:Math.floor(Math.random() * 29) + 1};
	    if((v1.$*1) > (v2.$*1)) {
		var tmp = v1;
		v1 = v2;
		v2 = tmp;
	    }
	    var mergeInfo = yield* versionGraph.getMergeStrategy(v1, v2);
	    assert.equal(v1, mergeInfo.V1);
	    assert.equal(v2, mergeInfo.V2);
```

<a name="simpleversiongraph-recordmergemergeinfo-newv-p1-p2"></a>
## .recordMerge(mergeInfo, newV, p1, p2)
should record a merge using the mergeInfo object obtained from getMergeStrategy(), and a merged version.

```js
function* (){
	    var v1 = {$:Math.floor(Math.random() * 29) + 1};
	    var v2 = {$:Math.floor(Math.random() * 29) + 1};
	    var mergeInfo = yield* versionGraph.getMergeStrategy(v1, v2);
	    yield* versionGraph.recordMerge(mergeInfo, {$:'newVersion'}, '', '');
	    yield* versionGraph.getMergeStrategy(v1, {$:'newVersion'}); // The new version should be in the graph
```

<a name="simpleversiongraph-appendpatchestomergeinfo-seq-taken"></a>
## .appendPatchesTo(mergeInfo, seq, taken)
should append all the labels along the path from x to V2 to the given sequence, if taken is true.

```js
function* (){
	    function Sequence() {
		this.seq = [];
		this.append = function*(item) {
		    this.seq.push(item);
		}
	    }
	    var v1 = {$:25};
	    var v2 = {$:24};
	    var mergeInfo = yield* versionGraph.getMergeStrategy(v1, v2);
	    var seq = new Sequence();
	    yield* versionGraph.appendPatchesTo(mergeInfo, seq, true);
	    
	    var m = 1; // The GCD of 24 and 25
	    seq.seq.forEach(function(item) {
		m *= item;
	    });
	    assert.equal(m, 24);
```

should append all the labels along the path from x to V1 to the given sequence, if taken is false.

```js
function* (){
	    function Sequence() {
		this.seq = [];
		this.append = function*(item) {
		    this.seq.push(item);
		}
	    }
	    var v1 = {$:25};
	    var v2 = {$:24};
	    var mergeInfo = yield* versionGraph.getMergeStrategy(v1, v2);
	    var seq = new Sequence();
	    yield* versionGraph.appendPatchesTo(mergeInfo, seq, false);
	    
	    var m = 1; // The GCD of 24 and 25
	    seq.seq.forEach(function(item) {
		m *= item;
	    });
	    assert.equal(m, 25);
```

<a name="transaction"></a>
# $transaction
should apply all patches enclosed in the hash that it holds as a single transaction.

```js
function* (){
	var ostore = new vercast.DummyObjectStore(new vercast.ObjectDispatcher(vercast.examples));
	var seq = ostore.getSequenceStore();
	ostore = new vercast.RootStore(ostore);
	yield* seq.append({_type: 'set', from: '', to: 'a'});
	yield* seq.append({_type: 'set', from: 'a', to: 'b'});
	yield* seq.append({_type: 'set', from: 'b', to: 'c'});
	yield* seq.append({_type: 'set', from: 'c', to: 'd'});
	var hash = yield* seq.hash();
	var v = yield* ostore.init('atom', {value: ''});
	var transPatch = {_type: 'transaction', hash: hash};
	var res = yield* ostore.trans(v, transPatch);
	res = yield* ostore.trans(res.v, {_type: 'get'});
	assert.equal(res.r, 'd');

	// Apply a transaction in reverse
	res = yield* ostore.trans(res.v, transPatch, true);
	res = yield* ostore.trans(res.v, {_type: 'get'});
	assert.equal(res.r, '');
```

