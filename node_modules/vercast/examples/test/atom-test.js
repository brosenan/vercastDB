"use strict";
var assert = require('assert');

var asyncgen = require('asyncgen'); 
var vercast = require('vercast');

describe('atom', function(){
    it('should allow setting and getting a value', asyncgen.async(function*(){
	var otb = new vercast.ObjectTestBed({atom: vercast.examples.atom}, 'atom', {value: 'a'});
	assert.equal(yield* otb.trans({_type: 'get'}), 'a');
	yield* otb.trans({_type: 'set', from: 'a', to: 'b'});
	yield* otb.trans({_type: 'set', from: 'b', to: 'c'});
	assert.equal(yield* otb.trans({_type: 'get'}), 'c');
    }));

});
