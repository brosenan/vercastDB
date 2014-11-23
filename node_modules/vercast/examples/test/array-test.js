"use strict";
var assert = require('assert');

var asyncgen = require('asyncgen'); 
var vercast = require('vercast');

describe('array', function(){
    it('should apply patches to different objects, by the patch\'s _key attribute', asyncgen.async(function*(){
	var otb = new vercast.ObjectTestBed(vercast.examples, 'array', {elementType: 'atom', args:  {value: ''}});
	yield* otb.trans({_type: 'set', _key: 'foo', from: '', to: 'x'});
	yield* otb.trans({_type: 'set', _key: 'bar', from: '', to: 'y'});
	assert.equal(yield* otb.trans({_type: 'get', _key: 'foo'}), 'x');
    }));
});
