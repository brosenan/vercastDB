"use strict";
exports.init = function*(ctx, args) { 
    this.value = args.value;
};

exports.set = function*(ctx, p, u) {
    if(u) {
	p = {from: p.to, to: p.from};
    }
    if(this.value !== p.from) {
	ctx.conflict('Expected: ' + p.from + ' actual: ' + this.value);
    }
    this.value = p.to;
};
exports.get = function*() {
    return this.value;
};