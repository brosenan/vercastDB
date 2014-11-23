"use strict";
module.exports = function(ostore, versionGraph, seqFactory) {
    this.init = function(type, args) {
	return ostore.init(type, args);
    };
    this.trans = function*(v, p) {
	var seq = seqFactory.createSequenceStore();
	yield* seq.append(p);
	var res = yield* ostore.trans(v, p);
	var ph = yield* seq.hash();
	yield* versionGraph.recordTrans(v, ph, res.v);
	return res;
    };
    this.merge = function*(v1, v2, resolve, atomic) {
	var mergeInfo = yield* versionGraph.getMergeStrategy(v1, v2);
	var seq = seqFactory.createSequenceStore();
	yield* versionGraph.appendPatchesTo(mergeInfo, seq, true);
	var vm = v1;

	var seqTaken = seqFactory.createSequenceStore();
	var conflictingPatches = [];
	while(!seq.isEmpty()) {
	    var p = yield* seq.shift();
	    try {
		vm = (yield* ostore.trans(vm, p)).v;
		yield* seqTaken.append(p);
	    } catch(e) {
		if(resolve && e.isConflict) {
		    conflictingPatches.push(p);
		} else {
		    throw e;
		}
	    }
	}
	var pathTaken = yield* seqTaken.hash();
	if(atomic) {
	    pathTaken = yield* createTransaction(pathTaken);
	}
	var pathNotTaken = yield* pathNotTakenHash(mergeInfo, conflictingPatches);
	yield* versionGraph.recordMerge(mergeInfo, vm, pathTaken, pathNotTaken);
	return vm;
    };
    function* pathNotTakenHash(mergeInfo, conflictingPatches) {
	var seq = seqFactory.createSequenceStore();
	var i;
	for(i = conflictingPatches.length - 1; i >= 0; i -= 1) {
	    yield* seq.append({_type: 'inv', patch: conflictingPatches[i]});
	}
	yield* versionGraph.appendPatchesTo(mergeInfo, seq, false);
	return yield* seq.hash();
    }
    function* createTransaction(hash) {
	var seq = seqFactory.createSequenceStore();
	yield* seq.append({_type: 'transaction', hash: hash});
	return yield* seq.hash();
    }
};
