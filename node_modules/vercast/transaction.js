"use strict";
module.exports = function*(ctx, p, u) {
    var seq = ctx.getSequenceStore();
    yield* seq.append(p.hash);
    var v = ctx.self();
    while(!seq.isEmpty()) {
	var p1;
	if(!u) {
	    p1 = yield* seq.shift();
	} else {
	    p1 = yield* seq.pop();
	}
	v = (yield* ctx.trans(v, p1, u)).v;
    }
    this._replaceWith(v);
};