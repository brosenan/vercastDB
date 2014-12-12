"use strict";
var assert = require('assert');

var asyncgen = require('asyncgen');
var vercast = require('vercast');

var vdb = require('vercastDB');

function createOStore(func) {
    var dispMap = Object.create(vercast.examples);
    dispMap.Treap = vdb.Treap;
    dispMap.test = {
	init: function*() {},
	test: func,
    };
    return new vercast.DummyObjectStore(new vercast.ObjectDispatcher(dispMap));
}

describe('.loadModule(ctx, rootID, key) [async]', function(){
    it('should return a module for the given Javascript code', asyncgen.async(function*(){
	var ostore = createOStore(function*(ctx, p, u) {
	    var module = yield* vdb.loadModule(ctx, p.tree, ['scripts', 'foo.js']);
	    return module.foo();
	});
	var tree = yield* ostore.init('Treap', {elementType: 'atom', args: {value: ''}});
	tree = (yield* ostore.trans(tree, {_type: 'set', 
					   _key: ['scripts', 'foo.js'],
					   from: '', 
					   to: 'exports.foo = function() { return "FOO"; };'})).v;
	var test = yield* ostore.init('test', {});
	var res = yield* ostore.trans(test, {_type: 'test', tree: tree});
	assert.equal(res.r, 'FOO');
    }));
    function* testModule(fooCode, barCode) {
	var ostore = createOStore(function*(ctx, p, u) {
	    var module = yield* vdb.loadModule(ctx, p.tree, ['scripts', 'foo.js']);
	    return module.foo();
	});
	var tree = yield* ostore.init('Treap', {elementType: 'atom', args: {value: ''}});
	tree = (yield* ostore.trans(tree, {_type: 'set', 
					   _key: ['scripts', 'foo.js'],
					   from: '', 
					   to: fooCode})).v;
	if(barCode) {
	    tree = (yield* ostore.trans(tree, {_type: 'set', 
					       _key: ['scripts', 'bar.js'],
					       from: '', 
					       to: barCode})).v;
	}
	var test = yield* ostore.init('test', {});
	var res = yield* ostore.trans(test, {_type: 'test', tree: tree});
	return res.r;
    }
    it('should not give the module access to gloabls', asyncgen.async(function*(){
	try {
	    yield* testModule('exports.foo = function() { process.exit(); };');
	} catch(e) {
	    assert.equal(e.message, "Cannot read property 'exit' of undefined");
	}
    }));
    it.skip('should interpret require() as loading of other modules under the same root', asyncgen.async(function*(){
	yield* testModule('var bar = require(["scripts", "bar.js"]); exports.foo = function() { return bar.bar(); };',
			  'exports.bar = function() { return "BAR"; };');
    }));

});