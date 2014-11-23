"use strict";
var assert = require('assert');

describe('yield', function(){
    it('should support es6 generators', function(){
	function* fib() {
	    var prev = 0;
	    var curr = 1;
	    while(true) {
		yield curr;
		var tmp = curr + prev;
		prev = curr;
		curr = tmp;
	    }
	}
	var n;
	for(n of fib()) {
	    if(n > 100) break;
	}
	assert.equal(n, 144);
    });
});
