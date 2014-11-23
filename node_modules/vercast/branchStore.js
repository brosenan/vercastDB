"use strict";
module.exports = function(ostore, atomicKVS, ecKVS) {
    this.init = function*(type, args) {
	return yield* ostore.init(type, args);
    };
    this.trans = function*(v, p) {
	return yield* ostore.trans(v, p);
    };
    this.fork = function*(b, v) {
	yield* ecKVS.newKey(b, v.$);
	yield* atomicKVS.newKey(b, v.$);
    };
    this.head = function*(b, attempts) {
	var v = yield* ecKVS.retrieve(b);
	attempts = attempts || 100;
	while(!v) {
	    attempts -= 1;
	    if(attempts === 0) {
		throw Error("Exhausted the number of attempts trying to fetch the head of branch " + b);
	    }
	    yield function(_) { setTimeout(_, 1);};
	    v = yield* ecKVS.retrieve(b);
	}
	return {$: v};
    };
    this.push = function*(b, v, atomic) {
	while(true) {
	    var oldVer = {$:yield* atomicKVS.retrieve(b)};
	    var newVer = yield* ostore.merge(oldVer, v, false, atomic);
	    var modified = yield* atomicKVS.modify(b, oldVer.$, newVer.$);
	    if(modified === newVer.$) {
		break;
	    }
	}
	yield* ecKVS.modify(b, newVer.$);
    };
    this.pull = function*(v, b) {
	return yield* ostore.merge(yield* this.head(b), v, true);
    };
};
