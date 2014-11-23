# TOC
   - [compareKeys(key1, key2)](#comparekeyskey1-key2)
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

