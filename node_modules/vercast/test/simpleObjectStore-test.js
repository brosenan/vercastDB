"use strict";
var assert = require('assert');

var asyncgen = require('asyncgen'); 
var vercast = require('vercast');

var describeObjectStore = require('./describeObjectStore');

function createOStore(dispMap) {
    var disp = new vercast.ObjectDispatcher(dispMap);
    var kvs = new vercast.DummyKeyValueStore();
    return new vercast.SimpleObjectStore(disp, kvs);
}

describe('SimpleObjectStore', function(){
    describeObjectStore(createOStore);
    
    it('should avoid running the patch method again if the patch has already been applied on an identical object', asyncgen.async(function*(){
	var count = 0;
	var dispMap = {
	    foo: {
		init: function*() { this.x = 0; },
		bar: function*(ctx, p, u) {
		    count += 1;
		    this.x += 1;
		},
	    },
	};
	var ostore = createOStore(dispMap);
	var v0 = yield* ostore.init('foo', {});
	var v1 = (yield* ostore.trans(v0, {_type: 'bar'})).v;
	assert.equal(count, 1);
	var v1Prime = (yield* ostore.trans(v0, {_type: 'bar'})).v;
	assert.equal(v1.$, v1Prime.$);
	// This should not 
	assert.equal(count, 1);
    }));
});
