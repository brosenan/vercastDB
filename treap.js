"use strict";
var asyncgen = require('asyncgen');
var crypto = require('crypto');
var assert = require('assert');
var vercastDB = require('./index.js');

function hash(value) {
    var h = crypto.createHash('sha256');
    h.update(value.toString());
    return h.digest('base64');
}

exports.init = function*(ctx, args) {
    var key = args.key;
    if(typeof this.key === 'object') {
	Object.freeze(key);
    }
    this.defaultValue = args.defaultValue || (yield* ctx.init(args.elementType, args.args));
    this.value = args.value || this.defaultValue;
    this.key = 'key' in args ? key : null;
    this.weight = this.key ? hash(this.key) : null;
    this.left = args.left || null;
    this.leftCount = this.left ? 
	(yield* ctx.trans(this.left, {_type: '_count'})).r : 0;
    this.right = args.right || null;
    this.rightCount = this.right ? 
	(yield* ctx.trans(this.right, {_type: '_count'})).r : 0;
};
exports._default = function*(ctx, p, u) {
    var res, field;
    if(this.key === null) {
	this.key = p._key;
	this.weight = hash(this.key);
	this.value = this.defaultValue;
	this.left = yield* ctx.init(this._type, {defaultValue: this.defaultValue});
	this.right = this.left;
	field = 'value';
    } else if(vercastDB.compareKeys(this.key, p._key) > 0) {
	field = 'left';
    } else if(vercastDB.compareKeys(this.key, p._key) < 0) {
	field = 'right';
    } else { // ===
	field = 'value';
    }
    res = yield* ctx.trans(this[field], p, u);
    this[field] = res.v;
    if(field !== 'value') {
	this[field + 'Count'] = 
	    (yield* ctx.trans(this[field], {_type: '_count'})).r;
	// Do I need to rotate?
	var child = (yield* ctx.trans(this[field], {_type: '_get'})).r;
	if(child.weight > this.weight) {
	    // I do need to rotate
	    if(field === 'right') {
		// rotate left
		var newThis = yield* ctx.init(this._type, {
		    key: ctx.clone(this.key),
		    value: this.value,
		    defaultValue: this.defaultValue,
		    left: this.left,
		    right: child.left,
		});
		var newChild = yield* ctx.init(this._type, {
		    key: child.key,
		    value: child.value,
		    defaultValue: this.defaultValue,
		    left: newThis,
		    right: child.right,
		});
		this._replaceWith(newChild);
	    } else { 
		// rotate right
		var newThis = yield* ctx.init(this._type, {
		    key: ctx.clone(this.key),
		    value: this.value,
		    defaultValue: this.defaultValue,
		    left: child.right,
		    right: this.right,
		});
		var newChild = yield* ctx.init(this._type, {
		    key: child.key,
		    value: child.value,
		    defaultValue: this.defaultValue,
		    left: child.left,
		    right: newThis,
		});
		this._replaceWith(newChild);
	    }
	}
    }
    if(field === 'value' && this.value.$ === this.defaultValue.$) {
	yield* removeNode(this);
    }
    return res.r;
};

function* removeNode(self) {
    if(self.rightCount === 0 && self.leftCount === 0) {
	self.key = null;
	self.weight = null;
	self.right = null;
	self.left = null;
    } else if(self.rightCount === 0) {
	self._replaceWith(self.left);
    } else if(self.leftCount === 0) {
	self._replaceWith(self.right);
    } else {
	self._replaceWith((yield* ctx.trans(this.left, {_type: "_mergeRight", 
							with: this.right})).v);
    }
}

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

exports._count = function*(ctx, p, u) {
    var count = this.rightCount + this.leftCount;
    if(this.value.$ !== this.defaultValue.$) {
	count += 1;
    }
    return count;
};

exports._mergeRight = function*(ctx, p, u) {
    if(this.rightCount === 0) {
	this.right = p.with;
    } else {
	this.right = (yield* ctx.trans(this.right, {_type: '_mergeLeft',
						    with: this.right})).v;
    }
};
exports._mergeLeft = function*(ctx, p, u) {
    if(this.leftCount === 0) {
	this.left = p.with;
    } else {
	this.left = (yield* ctx.trans(this.left, {_type: '_mergeRight',
						    with: this.left})).v;
    }
};

exports._get = function*(ctx, p, u) {
    return {key: ctx.clone(this.key),
	    value: this.value,
	    weight: this.weight,
	    right: this.right,
	    left: this.left,
	    rightCount: this.rightCount,
	    leftCount: this.leftCount};
};

exports._depth = function*(ctx, p, u) {
    if(this.key === null) {
	return 0;
    } else {
	var childDepths = (yield* asyncgen.parallel([
	    ctx.trans(this.left, p, u),
	    ctx.trans(this.right, p, u),
	])).map(function(x) { return x.r;});
	return Math.max.apply(undefined, childDepths) + 1;
    }
};

exports._keys = function*(ctx, p, u) {
    if(this.key === null) {
	return [];
    } else {
	var start = p.start || 0;
	var keys = (yield* ctx.trans(this.left, p, u)).r;
	start -= this.leftCount;
	if('limit' in p && keys.length === p.limit) {
	    return keys;
	}
	if(start <= 0) {
	    keys.push(this.key);
	}
	start -= 1;
	if('limit' in p && keys.length === p.limit) {
	    return keys;
	}
	return keys.concat((yield* ctx.trans(this.right, {
	    _type: p._type,
	    limit: p.limit - keys.length,
	    start: start,
	}, u)).r);
    }
};

exports._validate = function*(ctx, p, u) {
    if(this.key === null) {
	return;
    }
    var left = (yield* ctx.trans(this.left, {_type: '_get'})).r;
    var right = (yield* ctx.trans(this.right, {_type: '_get'})).r;
    if(left.key !== null) {
	assert(vercastDB.compareKeys(this.key, left.key) > 0, 'Key order: left');
	assert(this.weight > left.weight, 'Heap order: left');
    }
    if(right.key !== null) {
	assert(vercastDB.compareKeys(this.key, right.key) < 0, 'Key order: right');
	assert(this.weight > right.weight, 'Heap order: right');
    }
    yield* ctx.trans(this.left, p, u);
    yield* ctx.trans(this.right, p, u);
};

exports._remap = function*(ctx, p, u) {
    if(this.key === null) {
	return;
    }
    if(vercastDB.compareKeys(p.keyFrom, this.key) < 0) {
	yield* ctx.trans(this.left, p, u);
    }
    if(vercastDB.compareKeys(p.keyFrom, this.key) <= 0 && 
       vercastDB.compareKeys(p.keyTo, this.key) > 0) {
	yield* ctx.trans(p.mapper, {_type: 'map',
				    key: ctx.clone(this.key)}, u);
    }
    if(vercastDB.compareKeys(p.keyTo, this.key) > 0) {
	yield* ctx.trans(this.right, p, u);
    }
};