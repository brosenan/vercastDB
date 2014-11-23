"use strict";

module.exports = function(graphDB) {
    this.recordTrans = function*(v1, p, v2) {
	if(v1.$ != v2.$) {
	    yield* graphDB.addEdge(v1.$, p, v2.$);
	}
    }
    this.getMergeStrategy = function*(v1, v2) {
	var res = yield* graphDB.findCommonAncestor(v1.$, v2.$);
	var pathToFollow, pathNotToFollow;
	var mergeInfo = {x: {$:res.node},
			 V1: v1,
			 V2: v2};
	return mergeInfo;
    };
    this.recordMerge = function*(mergeInfo, newV, p1, p2) {
	yield* graphDB.addEdge(mergeInfo.V1.$, p1, newV.$);
	yield* graphDB.addEdge(mergeInfo.V2.$, p2, newV.$);
    };
    this.appendPatchesTo = function*(mergeInfo, seq, taken) {
	var path = yield* graphDB.findPath(mergeInfo.x.$, taken ? mergeInfo.V2.$ : mergeInfo.V1.$);
	var i;
	for(i = 0; i < path.length; i += 1) {
	    yield* seq.append(path[i]);
	}
    };
}

