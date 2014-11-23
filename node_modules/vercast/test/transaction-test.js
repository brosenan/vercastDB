"use strict";
var assert = require('assert');

var asyncgen = require('asyncgen'); 
var vercast = require('vercast');

describe('$transaction', function(){
    it('should apply all patches enclosed in the hash that it holds as a single transaction', asyncgen.async(function*(){
	var ostore = new vercast.DummyObjectStore(new vercast.ObjectDispatcher(vercast.examples));
	var seq = ostore.getSequenceStore();
	ostore = new vercast.RootStore(ostore);
	yield* seq.append({_type: 'set', from: '', to: 'a'});
	yield* seq.append({_type: 'set', from: 'a', to: 'b'});
	yield* seq.append({_type: 'set', from: 'b', to: 'c'});
	yield* seq.append({_type: 'set', from: 'c', to: 'd'});
	var hash = yield* seq.hash();
	var v = yield* ostore.init('atom', {value: ''});
	var transPatch = {_type: 'transaction', hash: hash};
	var res = yield* ostore.trans(v, transPatch);
	res = yield* ostore.trans(res.v, {_type: 'get'});
	assert.equal(res.r, 'd');

	// Apply a transaction in reverse
	res = yield* ostore.trans(res.v, transPatch, true);
	res = yield* ostore.trans(res.v, {_type: 'get'});
	assert.equal(res.r, '');
    }));
});
