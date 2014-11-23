"use strict";
var assert = require('assert');

var asyncgen = require('asyncgen'); 
var vercast = require('vercast');

function createOStore(dispMap) {
    var disp = new vercast.ObjectDispatcher(dispMap);
    return new vercast.DummyObjectStore(disp);
}

describe('$inv', function(){
    it('should unapply the underlying patch', asyncgen.async(function*(){
	var dispMap = {
	    $inv: vercast.$inv,
	    counter: {
		init: function*() {this.value = 0;},
		add: function*(ctx, p, u) {
		    this.value += (u?-1:1) * p.amount;
		    return this.value;
		},
	    },
	};
	var ostore = createOStore(dispMap);
	var v = yield* ostore.init('counter', {});
	var res = yield* ostore.trans(v, {_type: 'inv', 
					  patch: {_type: 'add',
						  amount: 2}});
	assert.equal(res.r, -2);
    }));

});
