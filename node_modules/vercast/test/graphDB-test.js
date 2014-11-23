"use strict";
var assert = require('assert');

var asyncgen = require('asyncgen'); 
var vercast = require('vercast');



module.exports = function(graphDB) {
    beforeEach(asyncgen.async(function*() {
	yield* graphDB.clear();
    }));

    function isPrime(x) {
	for(var i = 2; i <= Math.sqrt(x); i++) {
	    if(x%i == 0) return false;
	}
	return true;
    }
    function* createGraph(aMax) {
	var a, b;
	for(a = 1; a < aMax; a += 1) {
	    for(b = 1; b < a; b += 1) {
		if(a%b == 0 && isPrime(a/b)) {
		    yield* graphDB.addEdge(b, a/b, a);
		}
	    }
	}
    }
    describe('as GraphDB', function(){
	describe('addEdge', function(){
	    it('should accept an edge and add it to the graph', asyncgen.async(function*(){
		yield* graphDB.addEdge("foo", "likes", "bar");
		var shouldBeBar = yield* graphDB.queryEdge("foo", "likes");
		assert.equal(shouldBeBar, 'bar');
	    }));
	    it('should create a dual mapping, mapping also the destination to the source', asyncgen.async(function*(){
		    yield* graphDB.addEdge("foo", "likes", "bar");
		    var shouldBeFoo = yield* graphDB.queryBackEdge("bar", "likes"); 
		    assert.equal(shouldBeFoo, 'foo');
	    }));
	});
	describe('findCommonAncestor', function(){
	    it('should find the common ancestor of two nodes, and the path to each of them', asyncgen.async(function*(){
		yield* graphDB.addEdge('terah', 'p1', 'abraham');
		yield* graphDB.addEdge('abraham', 'p2', 'isaac');
		yield* graphDB.addEdge('isaac', 'p3', 'jacob');
		yield* graphDB.addEdge('jacob', 'p4', 'joseph');
		yield* graphDB.addEdge('abraham', 'p5', 'ismael');
		yield* graphDB.addEdge('isaac', 'p6', 'esaw');
		yield* graphDB.addEdge('jacob', 'p7', 'simon');
		var res = yield* graphDB.findCommonAncestor('simon', 'ismael');
		assert.equal(res.node, 'abraham');
	    }));
	    it('should handle the case where there are also common descendants', asyncgen.async(function*(){
		yield* createGraph(30);
		var res = yield* graphDB.findCommonAncestor(4, 6);
		assert.equal(res.node, 2);
	    }));
	    it('should return the path from the common ancestor to both nodes', asyncgen.async(function*(){
		yield* createGraph(30);
		var res = yield* graphDB.findCommonAncestor(8, 10);
		assert.equal(res.node, 2);
		assert.deepEqual(res.p1, [{l:'2', n:'4'}, {l:'2', n:'8'}]);
		assert.deepEqual(res.p2, [{l:'5', n:'10'}]);
	    }));
	});
    });
    describe('.findPath(x, y, cb(err, path))', function(){
	it('should return the labels along the edges from x to y', asyncgen.async(function*(){
	    yield* createGraph(30);
	    var path = yield* graphDB.findPath(3, 24);
	    var m = 1;
	    for(var i = 0; i < path.length; i++) {
		m *= path[i];
	    }
	    assert.equal(m, 8); // 24 / 3
	}));
	it('should always take the shortest path', asyncgen.async(function*(){
		yield* graphDB.addEdge('a', 'wrong1', 'b');
		yield* graphDB.addEdge('b', 'wrong2', 'c');
		yield* graphDB.addEdge('a', 'right', 'c');
		var path = yield* graphDB.findPath('a', 'c');
		assert.deepEqual(path, ['right']);
	}));
	it('should handle directed cycles correctly', asyncgen.async(function*(){
	    yield* graphDB.addEdge('a', 'right1', 'b');
	    yield* graphDB.addEdge('b', 'right2', 'c');
	    yield* graphDB.addEdge('c', 'wrong', 'b');
	    yield* graphDB.addEdge('c', 'right3', 'd');
	    var path = yield* graphDB.findPath('a', 'd');
	    assert.deepEqual(path, ['right1', 'right2', 'right3']);
	}));

    });

};
