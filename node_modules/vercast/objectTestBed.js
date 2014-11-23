"use strict";

var vercast = require('vercast');

module.exports = function(dispMap, type, args) {
    var disp = new vercast.ObjectDispatcher(dispMap);
    var ostore = new vercast.DummyObjectStore(disp);
    var v;

    dispMap.$digest = function*(ctx, p, u) {
	return ctx.self().$;
    };
    function* initialize() {
	if(v) {
	    return;
	}
	v = yield* ostore.init(type, args);
    }

    this.trans = function*(p) {
	yield* initialize();
	var res = yield* ostore.trans(v, p);
	v = res.v;
	return res.r;
    };

    (function() {
	var ostore2 = new vercast.DummyObjectStore(disp);
	function* reversibilityChecker(v1, p, u, v2, r, eff) {
	    var res = yield* ostore2.trans(v2, p, !u);
	    var d1 = (yield* ostore2.trans(v1, {_type: 'digest'})).r;
	    var d2 = (yield* ostore2.trans(res.v, {_type: 'digest'})).r;
	    if(d1 !== d2) {
		var obj = JSON.parse(v1.$);
		throw Error('Transformation "' + p._type + '" for type "' + obj._type + '" is not reversible');
	    }
	}
	ostore.addTransListener(reversibilityChecker);
    })();
    
    (function() {
	var verMap = {};
	var ostore2 = new vercast.DummyObjectStore(disp);
	function* commutativityChecker(v1, p, u, v2, r, eff) {
	    if(v1.$ in verMap) {
		for(var i = 0; i < verMap[v1.$].length; i += 1) {
		    var prev = verMap[v1.$][i];
		    try {
			var alt = yield* ostore2.trans(prev.v1, p, u);
			try {
			    alt = yield* ostore2.trans(alt.v, prev.p, prev.u);
			} catch(e) {
			    if(!e.isConflict) throw e;
			    alt.v = {$:''};
			}
			var d1 = alt.v.$ === '' ? '' : (yield* ostore2.trans(alt.v, {_type: 'digest'})).r;
			var d2 = (yield* ostore2.trans(v2, {_type: 'digest'})).r;
			if(d1 !== d2) {
			    var obj = JSON.parse(v1.$);
			    throw Error('Transformations "' + prev.p._type + '" and "' +
					p._type + '" for type "' + obj._type + 
					'" are independent but do not commute');
			}
		    } catch(e) {
			if(!e.isConflict) throw e;			
		    }
		}
	    }
	    if(!(v2.$ in verMap)) {
		verMap[v2.$] = [];
	    }
	    verMap[v2.$].push({v1: v1, p: p, u: u, r: r});
	};
	ostore.addTransListener(commutativityChecker);
    })();

};

