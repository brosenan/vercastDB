"use strict";
var events = require('events');

var vercast = require('vercast');


module.exports = function(disp, effSeqFactory) {
    var transListeners = [];
    effSeqFactory = effSeqFactory || new vercast.SequenceStoreFactory(new vercast.DummyKeyValueStore());
    this.init = function*(type, args) {
	var obj = yield* disp.init(createContext(this), type, args);
	return {$:JSON.stringify(obj)};
    };
    this.trans = function*(v, p, u) {
	var effSeq = effSeqFactory.createSequenceStore();
	var obj = JSON.parse(v.$);
	var monitor = new vercast.ObjectMonitor(obj);
	var r = yield* disp.apply(createContext(this, effSeq, v), monitor.proxy(), p, u);
	var v2 = v;
	if(monitor.object()._type) {
	    v2 = {$:monitor.json()};
	} else if(monitor.object().$) {
	    v2 = monitor.object();
	} else {
	    throw Error('new version is niether a avalid object nor an ID');
	}
	var eff = yield* effSeq.hash();
	for(var iListener = 0; iListener < transListeners.length; iListener += 1) {
	    yield* transListeners[iListener](v, p, u, v2, r, eff);
	}
	return {r: r, 
		v: v2,
		eff: eff};
    };
    this.getSequenceStore = function() {
	return effSeqFactory.createSequenceStore();
    };
    this.addTransListener = function(handler) {
	transListeners.push(handler);
    };
};
function createContext(self, effSeq, v) {
    return {
	init: function*(type, args) {
	    return yield* self.init(type, args);
	},
	trans: function*(v, p, u) {
	    var res = yield* self.trans(v, p, u);
	    yield* effSeq.append(res.eff);
	    return res;
	},
	conflict: function(reason) {
	    var err = Error(reason);
	    err.isConflict = true;
	    throw err;
	},
	effect: function*(p) {
	    yield* effSeq.append(p);
	},
	self: function() {
	    return v;
	},
	getSequenceStore: function() {
	    return self.getSequenceStore();
	},
    };
}
module.exports.createContext = createContext;
