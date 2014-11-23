module.exports = function(dispMap) {
    this.init = function*(ctx, type, args) {
	var cls = dispMap[type];
	if(!cls) {
	    throw Error('Unsupported object type: ' + type);
	}

	var obj = {_type: type};
	if(!cls.init) {
	    throw Error('Function init() not defined for type: ' + type);
	}
	yield* cls.init.call(obj, ctx, args);
	return obj;
    };
    
    this.apply = function*(ctx, obj, patch, unapply) {
	if(!obj._type) {
	    throw Error('Given object is not a valid object: does not have a _type field');
	}
	var cls = dispMap[obj._type];
	var method = cls[patch._type];
	if(!method) {
	    method = dispMap['$' + patch._type];
	}
	if(!method) {
	    method = cls._default;
	}
	if(!method) {
	    console.log(dispMap);
	    throw Error('Object type ' + obj._type + ' does not support patch ' + patch._type);
	}
	return yield* method.call(obj, ctx, patch, unapply);
    };
};

