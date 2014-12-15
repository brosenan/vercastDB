"use strict";
var assert = require('assert');

var asyncgen = require('asyncgen');
var vercast = require('vercast');
var vdb = require('vercastDB');

var dispMap = Object.create(vercast.examples);
dispMap.Treap = vdb.Treap;
dispMap.JsMapper = vdb.JsMapper;

describe('JsMapper', function(){
    var otb;
    beforeEach(function() {
	otb = new vercast.ObjectTestBed(dispMap, 'Treap', {elementType: 'atom', args:  {value: ''}}, true);
    });
    it('should map values to patches based on Javascript code', asyncgen.async(function*(){
	var code = [
	    "exports.doubleToDest = function (key, val) {",
	    "    key = ['dest'].concat(key.slice(1));    ",
	    "    return [{_type: 'set',		     ",
	    "	     _key: key,			     ",
	    "	     from: '',			     ",
	    "	     to: val * 2}];		     ",
	    "};                                      ",
	].join('\n');
	yield* otb.trans({_type: 'put', _key: ['src', 'a'], value: 1});
	yield* otb.trans({_type: 'put', _key: ['src', 'b'], value: 2});
	yield* otb.trans({_type: 'put', _key: ['js', 'map.js'], value: code});
	var mapper = yield* otb.objectStore().init('JsMapper', {
	    rootID: otb.current(),
	    key: ['js', 'map.js'],
	    name: 'doubleToDest',
	});
	yield* otb.trans({_type: '_remap', 
			  mapper: mapper,
			  keyFrom: ['src'],
			  keyTo: ['src', []]});
	assert.equal(yield* otb.trans({_type: 'get', _key: ['dest', 'a']}), 2);
	assert.equal(yield* otb.trans({_type: 'get', _key: ['dest', 'b']}), 4);
    }));

});