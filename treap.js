"use strict";
var asyncgen = require('asyncgen');
var crypto = require('crypto');
var assert = require('assert');
var vercast = require('vercast');
var vercastDB = require('./index.js');

function hash(value) {
    var h = crypto.createHash('sha256');
    h.update(JSON.stringify(value));
    return h.digest('base64');
}

var fieldMap = {'-1': 'right', '0': 'value', '1': 'left'};

exports.init = function*(ctx, args) {
    var key = args.key;
    if(typeof this.key === 'object') {
	Object.freeze(key);
    }
    this.defaultValue = args.defaultValue || (yield* ctx.init(args.elementType, args.args));
    this.value = args.value || this.defaultValue;
    this.key = 'key' in args ? key : null;
    this.weight = this.key ? hash(ctx.clone(this.key)) : null;
    this.left = args.left || null;
    this.leftCount = this.left ? 
	(yield* ctx.trans(this.left, {_type: '_count'})).r : 0;
    this.right = args.right || null;
    this.rightCount = this.right ? 
	(yield* ctx.trans(this.right, {_type: '_count'})).r : 0;
    this.maps = args.maps || {};
    //if(this.key !== null) console.log(this.key, this.weight);
};

var rotateLeft = function*(self, ctx, child) {
    rotateMaps(self.maps, child.maps, child.key, 'keyTo', 1);
    var newThis = yield* ctx.init(self._type, {
	key: ctx.clone(self.key),
	value: self.value,
	defaultValue: self.defaultValue,
	left: self.left,
	right: child.left,
	maps: self.maps.clone(),
    });
    var newChild = yield* ctx.init(self._type, {
	key: child.key,
	value: child.value,
	defaultValue: self.defaultValue,
	left: newThis,
	right: child.right,
	maps: child.maps,
    });
    self._replaceWith(newChild);
}

var rotateRight = function*(self, ctx, child) {
    rotateMaps(self.maps, child.maps, child.key, 'keyFrom', -1);
    var newThis = yield* ctx.init(self._type, {
	key: ctx.clone(self.key),
	value: self.value,
	defaultValue: self.defaultValue,
	left: child.right,
	right: self.right,
	maps: self.maps.clone(),
    });
    var newChild = yield* ctx.init(self._type, {
	key: child.key,
	value: child.value,
	defaultValue: self.defaultValue,
	left: child.left,
	right: newThis,
	maps: child.maps,
    });
    self._replaceWith(newChild);
};

function rotateMaps(selfMaps, childMaps, childKey, limitField, comp) {
    selfMaps.keys().forEach(function(key) {
	var mapping = selfMaps.get(key);
	if(vercastDB.compareKeys(mapping.get(limitField), childKey) == comp) {
	    selfMaps.put(key, undefined);
	    childMaps[key] = mapping.clone();
	}
    });
}

exports._default = function*(ctx, p, u) {
    var res, field;
    if(this.key === null) {
	this.key = p._key;
	this.weight = hash(ctx.clone(this.key));
	this.value = this.defaultValue;
	this.left = yield* ctx.init(this._type, {defaultValue: this.defaultValue});
	this.right = this.left;
	//if(this.key !== null && this.key.clone) console.log(1, this.key.clone(), this.weight);
	field = 'value';
    } else {
	field = fieldMap[vercastDB.compareKeys(this.key, p._key)];
    }
    res = yield* ctx.trans(this[field], p, u);
    var versionBefore = this[field];
    this[field] = res.v;
    yield* applyMapping(this, ctx, p._key, field, versionBefore);
    if(field !== 'value') {
	this[field + 'Count'] = 
	    (yield* ctx.trans(this[field], {_type: '_count'})).r;
	// Do I need to rotate?
	var child = (yield* ctx.trans(this[field], {_type: '_get'})).r;
	if(child.weight > this.weight) {
	    // I do need to rotate
	    if(field === 'right') {
		yield* rotateLeft(this, ctx, child);
	    } else { 
		yield* rotateRight(this, ctx, child);
	    }
	}
    }
    if(field === 'value' && this.value.$ === this.defaultValue.$) {
	yield* removeNode(this);
    }
    return res.r;
};

function* applyMapping(self, ctx, key, field, versionBefore) {
    var ids = self.maps.keys();
    for(let i = 0; i < ids.length; i++) {
	var mapping = self.maps.get(ids[i]);
	if(vercastDB.compareKeys(key, mapping.get('keyFrom')) >= 0 && vercastDB.compareKeys(key, mapping.get('keyTo')) < 0) {
	    var newValue = (yield* ctx.trans(self[field], {_type: 'get', _key: key})).r;
	    var oldValue = (yield* ctx.trans(versionBefore, {_type: 'get', _key: key})).r;
	    var invPatches = (yield* ctx.trans(mapping.get('mapper'), {_type: 'map', 
							     key: key,
							     value: oldValue})).r
		.map(function(p) {return {_type: 'inv', patch: p}});
	    invPatches.reverse();
	    var directPatches = (yield* ctx.trans(mapping.get('mapper'), {_type: 'map', 
							       key: key,
							       value: newValue})).r;
	    while(invPatches.length > 0 && directPatches.length > 0) {
		if(JSON.stringify(invPatches[0].patch) === JSON.stringify(directPatches[0])) {
		    invPatches.shift();
		    directPatches.shift();
		} else {
		    break;
		}
	    }
	    var patches = invPatches.concat(directPatches);
	    for(let i = 0; i < patches.length; i++) {
		yield* ctx.effect(patches[i]);
	    }
	}
    }
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
	digest += this.key + '=>' + (yield* ctx.trans(this.value, p, u)).r;
	digest += "[";
	this.maps.keys().forEach(function(x) {
	    digest += x + ",";
	});
	digest += "];";
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
	    leftCount: this.leftCount,
	    maps: this.maps.clone()};
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

function calculateMappingID(p) {
    var range = [p.keyFrom, p.keyTo];
    var rangeID = vercast.ObjectMonitor.seal(range);
    return p.mapper ? p.mapper.$ + ':' + rangeID : '';
}

function addMapping(self, ctx, p) {
    var id = calculateMappingID(p);
    if(p.oldMapping) {
	self.maps.put(p.oldMapping, undefined);
    }
    
    if(self.maps.get(id)) {
	ctx.conflict('Mapping already exists: ' + id);
    }
    if(id !== '') {
	self.maps.put(id, p);
    }
    return id;
}

exports._remap = function*(ctx, p, u) {
    var res;
    if(this.key === null) {
	return addMapping(this, ctx, p);
    } else if(vercastDB.compareKeys(this.key, p.keyFrom) < 0) {
	res = yield* ctx.trans(this.right, p, u);
	this.right = res.v;
	return res.r;
    } else if(vercastDB.compareKeys(this.key, p.keyTo) > 0) {
	res = yield* ctx.trans(this.left, p, u);
	this.left = res.v;
	return res.r;
    } else {
	yield* exports._remapRange.call(this, ctx, {
	    _type: '_remapRange',
	    keyFrom: p.keyFrom,
	    keyTo: p.keyTo,
	    mapper: p.mapper,
	    oldMapping: p.oldMapping}, u);
	return addMapping(this, ctx, p);
    }
};

var idSplitRegex = /(.*):(.*)/;

exports._remapRange = function*(ctx, p, u) {
    if(this.key === null) {
	return;
    }
    if(vercastDB.compareKeys(p.keyFrom, this.key) < 0) {
	yield* ctx.trans(this.left, p, u);
    }
    if(vercastDB.compareKeys(p.keyFrom, this.key) <= 0 && 
       vercastDB.compareKeys(p.keyTo, this.key) > 0) {
	var value = (yield* ctx.trans(this.value, {_type: 'get'})).r;
	var patches = [];
	if(p.oldMapping) {
	    var oldMapper = {$: idSplitRegex.exec(p.oldMapping)[1]};
	    patches = (yield* ctx.trans(oldMapper, {_type: 'map',
						    key: ctx.clone(this.key),
						    value: value}, u)).r
		.map(function(x) { return {_type: 'inv', patch: x}; });
	    patches.reverse();
	}
	if(p.mapper) {
	    patches = patches.concat((yield* ctx.trans(p.mapper, {
		_type: 'map',
		key: ctx.clone(this.key),
		value: value}, u)).r);
	}
	for(let i = 0; i < patches.length; i++) {
	    yield* ctx.effect(patches[i]);
	}
    }
    if(vercastDB.compareKeys(p.keyTo, this.key) > 0) {
	yield* ctx.trans(this.right, p, u);
    }
};