"use strict";
var assert = require('assert');

var asyncgen = require('asyncgen'); 
var vercast = require('vercast');

var graphDB = new vercast.DummyGraphDB();
var versionGraph = new vercast.SimpleVersionGraph(graphDB);

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
		yield* versionGraph.recordTrans({$:b}, '' + a/b, {$:a});
	    }
	}
    }
}
describe('SimpleVersionGraph', function(){
    afterEach(function() {
	graphDB.abolish();
    });
    describe('.recordTrans(v1, p, v2)', function(){
	it('should return a callback with no error if all is OK', asyncgen.async(function*(){
	    yield* versionGraph.recordTrans({$:'foo'}, {_type: 'myPatch'}, {$:'bar'});
	}));
    });
    describe('.getMergeStrategy(v1, v2)', function(){
	beforeEach(asyncgen.async(function*() {
	    yield* createGraph(30);
	}));
	it('should return x as the common ancestor of v1 and v2', asyncgen.async(function*(){
	    var mergeInfo = yield* versionGraph.getMergeStrategy({$:18}, {$:14});
	    assert.equal(mergeInfo.x.$, 2);
	}));
	it('should return either v1 or v2 as V1, and the other as V2', asyncgen.async(function*(){
	    var v1 = {$:Math.floor(Math.random() * 29) + 1};
	    var v2 = {$:Math.floor(Math.random() * 29) + 1};
	    var mergeInfo = yield* versionGraph.getMergeStrategy(v1, v2);
	    assert(mergeInfo.V1.$ == v1.$ || mergeInfo.V1.$ == v2.$, 'V1 should be either v1 or v2: ' + mergeInfo.V1.$);
	    assert(mergeInfo.V2.$ == v1.$ || mergeInfo.V2.$ == v2.$, 'V2 should be either v1 or v2: ' + mergeInfo.V2.$);
	    assert(mergeInfo.V1.$ != mergeInfo.V2.$ || v1.$ == v2.$, 'V1 and V2 should not be the same one');
	}));
	it('should set V1 and V2 to be v1 and v2 respectively if resolve=true', asyncgen.async(function*(){
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
	}));

    });
    describe('.recordMerge(mergeInfo, newV, p1, p2)', function(){
	beforeEach(asyncgen.async(function*() {
	    yield* createGraph(30);
	}));
	it('should record a merge using the mergeInfo object obtained from getMergeStrategy(), and a merged version', asyncgen.async(function*(){
	    var v1 = {$:Math.floor(Math.random() * 29) + 1};
	    var v2 = {$:Math.floor(Math.random() * 29) + 1};
	    var mergeInfo = yield* versionGraph.getMergeStrategy(v1, v2);
	    yield* versionGraph.recordMerge(mergeInfo, {$:'newVersion'}, '', '');
	    yield* versionGraph.getMergeStrategy(v1, {$:'newVersion'}); // The new version should be in the graph
	}));
    });
    describe('.appendPatchesTo(mergeInfo, seq, taken)', function(){
	beforeEach(asyncgen.async(function*() {
	    yield* createGraph(30);
	}));
	it('should append all the labels along the path from x to V2 to the given sequence, if taken is true', asyncgen.async(function*(){
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
	}));
	it('should append all the labels along the path from x to V1 to the given sequence, if taken is false', asyncgen.async(function*(){
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
	}));
    });
});
