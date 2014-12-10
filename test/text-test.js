"use strict";
var assert = require('assert');

var DiffMatchPatch = require('diff-match-patch');

var asyncgen = require('asyncgen');
var vercast = require('vercast');

var vdb = require('vercastDB');

var dispMap = Object.create(vercast.examples);
dispMap.Text = vdb.Text;

var otb;

describe('Text', function(){
    beforeEach(function() {
	otb = new vercast.ObjectTestBed(dispMap, 'Text', {text: ''});
    });
    describe('get', function(){
	it('should return the content of the text object', asyncgen.async(function*(){
	    var v = yield* otb.objectStore().init('Text', {text: 'Foo'});
	    assert.equal((yield* otb.objectStore().trans(v, {_type: 'get'})).r, 'Foo');
	}));
    });
    describe('patch', function(){
	it('should apply the given patch to the text', asyncgen.async(function*(){
	    var dmp = new DiffMatchPatch();
	    var patch = dmp.patch_make('', 'this is some text');
	    patch = dmp.patch_toText(patch);
	    yield* otb.trans({_type: 'patch', patch: patch});
	    assert.equal(yield* otb.trans({_type: 'get'}), 'this is some text');
	}));
	it('should report a conflict if one is detected', asyncgen.async(function*(){
	    var dmp = new DiffMatchPatch();
	    var patch0 = dmp.patch_toText(dmp.patch_make('', 'The answer is: '));
	    var patch1 = dmp.patch_toText(dmp.patch_make('The answer is: ', 'The answer is: yes'));
	    var patch2 = dmp.patch_toText(dmp.patch_make('The answer is: ', 'The answer is: no'));
	    yield* otb.trans({_type: 'patch', patch: patch0});
	    yield* otb.trans({_type: 'patch', patch: patch1});
	}));

    });
});