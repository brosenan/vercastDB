"use strict";
var assert = require('assert');

var asyncgen = require('asyncgen'); 
var vercast = require('vercast');

function createOStore(dispMap) {
    var kvs = new vercast.DummyKeyValueStore();
    var disp = new vercast.ObjectDispatcher(dispMap);
    return new vercast.DummyObjectStore(disp);
}

describe('RootStore', function(){
    describe('.init(type, args)', function(){
	it('should return an initial version ID of a new object', asyncgen.async(function*(){
	    var called = false;
	    var dispMap = {
		foo: {
		    init: function*() { called = true; },
		},
	    };
	    var rootStore = new vercast.RootStore(createOStore(dispMap));
	    var v = yield* rootStore.init('foo', {});
	    assert(called, 'constructor should have been called');
	}));
    });
    describe('.trans(v, p, u) -> {v,r}', function(){
	it('should call a patch method and return its returned value', asyncgen.async(function*(){
	    var dispMap = {
		counter: {
		    init: function*() { this.value = 0; },
		    add: function*(ctx, p, u) {
			this.value += (u?-1:1) * p.amount;
			return this.value;
		    },
		},
	    };
	    var rootStore = new vercast.RootStore(createOStore(dispMap));
	    var v = yield* rootStore.init('counter', {});
	    var pair = yield* rootStore.trans(v, {_type: 'add', amount: 2});
	    assert.equal(pair.r, 2);
	    pair = yield* rootStore.trans(pair.v, {_type: 'add', amount: 3}, true);
	    assert.equal(pair.r, -1);
	}));
	it('should apply the effect set internally', asyncgen.async(function*(){
	    var dispMap = {
		dir: {
		    init: function*(ctx, args) {
			this.foo = yield* ctx.init('foo', {});
			this.bar = yield* ctx.init('bar', {});
		    },
		    apply: function*(ctx, p, u) {
			var pair = yield* ctx.trans(this[p.name], p.patch, u);
			this[p.name] = pair.v;
			return pair.r;
		    },
		},
		foo: {
		    init: function*() { this.foo = 0; },
		    inc: function*(ctx, p, u) {
			this.foo += (u?-1:1);
			return this.foo;
		    },
		},
		bar: {
		    init: function*() { },
		    incFoo: function*(ctx, p, u) {
			yield* ctx.effect({_type: 'apply', name: 'foo', patch: {_type: 'inc'}});
		    },
		},
	    };
	    var rootStore = new vercast.RootStore(createOStore(dispMap));
	    var v = yield* rootStore.init('dir', {});
	    var pair = yield* rootStore.trans(v, {_type: 'apply', 
						  name: 'bar', 
						  patch: {_type: 'incFoo'}});
	    pair = yield* rootStore.trans(pair.v, {_type: 'apply',
						   name: 'foo',
						   patch: {_type: 'inc'}});
	    assert.equal(pair.r, 2);
	}));
	it('should return the return value of the original patch', asyncgen.async(function*(){
	    var dispMap = {
		foo: {
		    init: function*() {},
		    bar: function*(ctx) {
			yield* ctx.effect({_type: 'baz'});
			return 1;
		    },
		    baz: function*() {
			return 2;
		    },
		}
	    };
	    var rootStore = new vercast.RootStore(createOStore(dispMap));
	    var v = yield* rootStore.init('foo', {});
	    var res = yield* rootStore.trans(v, {_type: 'bar'});
	    assert.equal(res.r, 1);
	}));

    });

});
