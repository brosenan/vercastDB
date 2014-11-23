"use strict";
var assert = require('assert');

var asyncgen = require('asyncgen'); 
var vercast = require('vercast');

describe('SimpleQueue', function(){
    it('should retrieve elements in the same order they were entered', asyncgen.async(function*(){
	var queue = new vercast.SimpleQueue();
	var i;
	for(i = 0; i < 10; i++) {
	    yield* queue.enqueue(i);
	}
	for(i = 0; i < 10; i++) {
	    assert(!(yield* queue.isEmpty()), 'queue should not be empty yet');
	    var n = yield* queue.dequeue();
	    assert.equal(n, i);
	}
	assert(yield* queue.isEmpty(), 'queue should be empty');
    }));

});
