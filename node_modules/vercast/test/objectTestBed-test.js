"use strict";
var assert = require('assert');

var asyncgen = require('asyncgen'); 
var vercast = require('vercast');

describe('ObjectTestBed', function(){
    describe('.trans(p)', function(){
	it('should apply a patch, returning the result', asyncgen.async(function*(){
	    var dispMap = {
		counter: {
		    init: function*() {this.value = 0;},
		    add: function*(ctx, p, u) {
			this.value += (u?-1:1) * p.amount;
			return this.value;
		    },
		},
	    };
	    var otb = new vercast.ObjectTestBed(dispMap, 'counter', {});
	    var r = yield* otb.trans({_type: 'add', amount: 2});
	    assert.equal(r, 2);
	    r = yield* otb.trans({_type: 'add', amount: 3});
	    assert.equal(r, 5);
	}));
	describe('reversibilityChecker', function(){
	    it('should fail for non-reversible transformations', asyncgen.async(function*(){
		var dispMap = {
		    badCounter: {
			init: function*() {this.value = 0;},
			add: function*(ctx, p, u) {
			    this.value += p.amount; // ignoring u
			    return this.value;
			},
		    },
		};
		var otb = new vercast.ObjectTestBed(dispMap, 'badCounter', {});
		try {
		    yield* otb.trans({_type: 'add', amount: 2});
		    assert(false, 'error is expected');
		} catch(e) {
		    assert.equal(e.message, 'Transformation "add" for type "badCounter" is not reversible');
		}
	    }));
	    it('should consult a digest() method (if defined) to get a representation of the value', asyncgen.async(function*(){
		var dispMap = {
		    counter: {
			init: function*() {
			    this.value = 0;
			    this.generation = 0;
			},
			add: function*(ctx, p, u) {
			    this.value += (u?-1:1) * p.amount;
			    this.generation += 1; // This is not reversible
			    return this.value;
			},
			digest: function*() {
			    return this.value; // only the value matters
			},
		    },
		};
		var otb = new vercast.ObjectTestBed(dispMap, 'counter', {});
		var r = yield* otb.trans({_type: 'add', amount: 2});
		assert.equal(r, 2);
		r = yield* otb.trans({_type: 'add', amount: 3});
		assert.equal(r, 5);
	    }));
	});
	describe('commutativityChecker', function(){
	    it('should fail for independent transformations that do not commute', asyncgen.async(function*(){
		var dispMap = {
		    badCounter: {
			init: function*() {this.value = 0;},
			add: function*(ctx, p, u) {
			    this.value += (u?-1:1) * p.amount;
			    return this.value;
			},
			mult: function*(ctx, p, u) {
			    if(u) {
				this.value /= p.amount;
			    } else {
				this.value *= p.amount;
			    }
			    return this.value;
			},
		    },
		};
		var otb = new vercast.ObjectTestBed(dispMap, 'badCounter', {});
		yield* otb.trans({_type: 'add', amount: 2});
		try {
		    yield* otb.trans({_type: 'mult', amount: 3});
		    assert(false, 'error is expected');
		} catch(e) {
		    assert.equal(e.message, 'Transformations "add" and "mult" for type "badCounter" are independent but do not commute');
		}
	    }));
	    it('should not fail when the transformations are not independent', asyncgen.async(function*(){
		var dispMap = {
		    atom: {
			init: function*(ctx, args) { this.value = args.value; },
			change: function*(ctx, p, u) {
			    var from = u ? p.to : p.from;
			    var to = u ? p.from : p.to;
			    if(this.value !== from) {
				ctx.conflict('Expected: ' + from + ' found: ' + this.value);
			    }
			    this.value = to;
			},
		    },
		};
		var otb = new vercast.ObjectTestBed(dispMap, 'atom', {value: 'a'});
		yield* otb.trans({_type: 'change', from: 'a', to: 'b'});
		yield* otb.trans({_type: 'change', from: 'b', to: 'c'});
	    }));
	    it('should fail when for independent p1 and p2, one permutation conflicts', asyncgen.async(function*(){
		var dispMap = {
		    badAtom: {
			init: function*(ctx, args) { this.value = args.value; },
			change: function*(ctx, p, u) {
			    var from = u ? p.to : p.from;
			    var to = u ? p.from : p.to;
			    if(this.value > from) {
				ctx.conflict('Expected: ' + from + ' found: ' + this.value);
			    }
			    this.value = to;
			},
		    },
		};
		var otb = new vercast.ObjectTestBed(dispMap, 'badAtom', {value: 0});
		yield* otb.trans({_type: 'change', from: 0, to: 1});
		try {
		    yield* otb.trans({_type: 'change', from: 1, to: 2});
		    assert(false, 'previous statement should fail');
		} catch(e) {
		    assert.equal(e.message, 'Transformations "change" and "change" for type "badAtom" are independent but do not commute');
		}
	    }));
	    it('should fail on non-commutative independent patches even if p1 and p2 are not following one anotherp', asyncgen.async(function*(){
		var dispMap = {
		    badAtom: {
			init: function*(ctx, args) { this.value = args.value; },
			change: function*(ctx, p, u) {
			    var from = u ? p.to : p.from;
			    var to = u ? p.from : p.to;
			    if(this.value > from) {
				ctx.conflict('Expected: ' + from + ' found: ' + this.value);
			    }
			    this.value = to;
			},
			get: function*() {
			    return this.value;
			},
		    },
		};
		var otb = new vercast.ObjectTestBed(dispMap, 'badAtom', {value: 0});
		yield* otb.trans({_type: 'change', from: 0, to: 1});
		assert.equal(yield* otb.trans({_type: 'get'}), 1);
		try {
		    yield* otb.trans({_type: 'change', from: 1, to: 2});
		    assert(false, 'previous statement should fail');
		} catch(e) {
		    assert.equal(e.message, 'Transformations "change" and "change" for type "badAtom" are independent but do not commute');
		}
	    }));
	    it('should consult a digest() method (if exists) to determine version equivalence', asyncgen.async(function*(){
		var dispMap = {
		    counter: {
			init: function*() {
			    this.value = 0;
			    this.history = '';
			},
			add: function*(ctx, p, u) {
			    this.value += (u?-1:1) * p.amount;
			    if(!u) {
				this.history = this.history + ':' + this.value;
			    } else {
				this.history = this.history.substr(0, this.history.length - 1 - ('' + this.value).length);
			    }
			    return this.value;
			},
			digest: function*(ctx, p, u) {
			    return this.value;
			},
		    },
		};
		var otb = new vercast.ObjectTestBed(dispMap, 'counter', {});
		var r = yield* otb.trans({_type: 'add', amount: 2});
		assert.equal(r, 2);
		r = yield* otb.trans({_type: 'add', amount: 3});
		assert.equal(r, 5);
	    }));
	});
    });
});
