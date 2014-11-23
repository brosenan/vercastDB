"use strict";
var assert = require('assert');

var asyncgen = require('asyncgen'); 
var vercast = require('vercast');

var describeObjectStore = require('./describeObjectStore');

describe('DummyObjectStore', function(){
    function createOStore(dispMap) {
	var disp = new vercast.ObjectDispatcher(dispMap);
	return new vercast.DummyObjectStore(disp);
    }
    describeObjectStore(createOStore);

    describe('.addTransListener(handler(v1, p, u, v2, r, eff))', function(){
	it('should call the handler on each successful call to trans()', asyncgen.async(function*(){
	    var dispMap = {
		foo: {
		    init: function*() { this.value = 0; },
		    bar: function*(ctx) { this.value += 1;
					  yield* ctx.effect({a:1});
					  return 99;},
		},
	    };
	    var ostore = createOStore(dispMap);
	    var called = false;
	    var foo;
	    var v2_out, eff_out;
	    ostore.addTransListener(function*(v1, p, u, v2, r, eff) {
		called = true;
		assert.equal(v1.$, foo.$);
		assert.deepEqual(p, {_type: 'bar', x: 2});
		assert.equal(u, false);
		v2_out = v2;
		assert.equal(r, 99);
		eff_out = eff;
	    });
	    foo = yield* ostore.init('foo', {});
	    var res = yield* ostore.trans(foo, {_type: 'bar', x: 2}, false);
	    assert(called, 'handler should have been called');
	    assert.equal(v2_out.$, res.v.$);

	    var seq = ostore.getSequenceStore();
	    yield* seq.append(eff_out);
	    assert.deepEqual(yield* seq.shift(), {a:1});
	}));
    });
});
