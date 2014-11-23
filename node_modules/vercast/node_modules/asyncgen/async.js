"use strict";
exports.thunkify = function(func) {
    return function() {
	var args = Array.prototype.slice.call(arguments);
	return function(cb) {
	    return func.apply(this, args.concat([cb]));
	};
    };
};

exports.run = function(func, cb) {
    var gen = func();
    execute(gen, cb);
};

function execute(gen, cb) {
    next();

    function next(err, val) {
	try {
	    if(err) gen.throw(err);

	    var iter = gen.next(val);
	    if(iter.done) return cb(undefined, iter.value);
	
	    iter.value.call(this, next);
	} catch(e) {
	    return cb(e);
	}
    }
}

exports.async = function(genfunc) {
    var resfunc =  function(cb) {
	exports.run(genfunc, cb);
    };
    resfunc.toString = function() { return genfunc.toString(); };
    return resfunc;
};

exports.parallel = function*(generators) {
    var i;
    var count = generators.length;
    var res = new Array(generators.length);

    function handler(i, cb) {
	return function(err, value) {
	    if(err) {
		return cb(err);
	    }
	    res[i] = value;
	    count -= 1;
	    if(count === 0) {
		cb();
	    }
	};
    }
    
    yield function(_) {
	for(i = 0; i < generators.length; i++) {
	    execute(generators[i], handler(i, _));
	}
    };
    return res;
};