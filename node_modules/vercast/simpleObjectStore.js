"use strict";
var vercast = require('vercast');

module.exports = function(disp, kvs) {
    var factory = new vercast.SequenceStoreFactory(kvs);

    this.init = function*(type, args) {
	var obj = yield* disp.init(vercast.DummyObjectStore.createContext(this), type, args);
	var monitor = new vercast.ObjectMonitor(obj);
	var id = {$:monitor.hash()};
	Object.freeze(id);
	yield* kvs.store(id.$, JSON.stringify(obj));
	return id;
    };
    this.trans = function*(v, p, u) {
	if(typeof v.$ === 'undefined') {
	    throw Error('undefined version ID');
	}
	var json = yield* kvs.fetch(v.$);
	if(typeof json === 'undefined') {
	    throw Error('No object version matching id: ' + v.$);
	}
	
	// Check for a cached result
	var pHash = vercast.ObjectMonitor.seal(p);
	var cachedKey = v.$ + '>' + pHash;
	var cachedResult = yield* kvs.fetch(cachedKey);
	if(typeof cachedResult === 'string') {
	    return JSON.parse(cachedResult);
	}
	
	var effSeq = factory.createSequenceStore();
	var obj = JSON.parse(json);
	var monitor = new vercast.ObjectMonitor(obj);
	var res = yield* disp.apply(vercast.DummyObjectStore.createContext(this, effSeq, v), monitor.proxy(), p, u);
	if(monitor.object()._type) {
	    v = {$:monitor.hash()};
	    yield* kvs.store(v.$, monitor.json());
	} else if(monitor.object().$) {
	    v = monitor.object();
	} else {
	    throw Error('new version is niether a avalid object nor an ID');
	}
	Object.freeze(v);

	// Cache the result
	var retVal = {v: v, r: res, eff: yield* effSeq.hash()};
	yield* kvs.store(cachedKey, JSON.stringify(retVal));
	return retVal;
    };
    this.getSequenceStore = function() {
	return factory.createSequenceStore();
    };
};
