"use strict";
var assert = require('assert');

var DiffMatchPatch = require('diff-match-patch');

var vdb = require('vercastDB');

var textutil = vdb.textutil;
var dmp = new DiffMatchPatch();

var AND = function(x, y) { return x && y; };

describe('textutil', function(){
    describe('.revertPatches(patch)', function(){
	it('should revert a patch', function(){
	    var text1 = "Hello, world";
	    var text2 = "Hola, mondi";
	    var patches = dmp.patch_make(text1, text2);
	    var patchRes = dmp.patch_apply(textutil.revertPatches(patches), text2);
	    assert(patchRes[1].reduce(AND, true), 'All patches should succeed');
	    assert.equal(patchRes[0], text1);
	});
	function testReversal(text1, text2) {
	    var patches = dmp.patch_make(text1, text2);
	    var patchRes = dmp.patch_apply(textutil.revertPatches(patches), text2);
	    assert(patchRes[1].reduce(AND, true), 'All patches should succeed');
	    assert.equal(patchRes[0], text1);
	}
	it('should handle more complex strings', function(){
	    testReversal('hi, who did you say you were?',
			 'Hi, Who Did You say you Were?');
	    testReversal('abcdefghijklmn\nopqrstuvwxyz',
			 'abcdefghijkLmnopqrsTuvwxyz');
	});

    });
});