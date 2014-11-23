"use strict";

exports.init = function*(ctx, args) {
    this.defaultValue = args.defaultValue || (yield* ctx.init(args.elementType, args.args));
    this.value = args.value || null;
    this.key = args.key || null;
    this.left = null;
    this.right = null;
};
exports._default = function*(ctx, p, u) {
    var res, field;
    if(this.key === null) {
	this.key = p._key;
	this.value = this.defaultValue;
	field = 'value';
    } else if(this.key < p._key) {
	if(this.left === null) {
	    this.left = yield* ctx.init('array', {defaultValue: this.defaultValue,
						  key: p._key,
						  value: this.defaultValue});
	}
	field = 'left';
    } else if(this.key > p._key) {
	if(this.right === null) {
	    this.right = yield* ctx.init('array', {defaultValue: this.defaultValue,
						  key: p._key,
						  value: this.defaultValue});
	}
	field = 'right';
    } else { // ===
	field = 'value';
    }
    res = yield* ctx.trans(this[field], p, u);
    this[field] = res.v;
    return res.r;
};
exports.digest = function*(ctx, p, u) {
    var digest = '';
    if(this.left !== null) {
	digest += (yield* ctx.trans(this.left, p, u)).r;
    }
    if(this.key !== null && this.value.$ !== this.defaultValue.$) {
	digest += this.key + '=>' + (yield* ctx.trans(this.value, p, u)).r + ';';
    }
    if(this.right !== null) {
	digest += (yield* ctx.trans(this.right, p, u)).r;
    }
};