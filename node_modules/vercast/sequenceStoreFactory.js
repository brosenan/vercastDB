"use strict";

var vercast = require('vercast');

module.exports = function(kvs) {
    this.createSequenceStore = function() {
	return new SequenceStore();
    };
   
    function SequenceStore() {
	var seq = [];
	this.append = function*(obj) {
	    if(obj === '') {
		return;
	    }
	    seq.push(obj);
	};
	this.isEmpty = function() {
	    return seq.length === 0;
	};
	function* removeElement(op) {
	    var first = seq[op](); 
	    while(typeof first === 'string') {
		var json = yield* kvs.fetch(first);
		if(typeof json === 'undefined') {
		    throw Error('Invalid key for sequence element: ' + first);
		}
		var prefix = JSON.parse(json);
		if(Array.isArray(prefix)) {
		    seq = prefix.concat(seq);
		    first = seq[op]();
		} else {
		    if(prefix.$) {
			delete prefix.$;
		    }
		    first = prefix;
		}
	    }
	    return first;
	}
	this.shift = function*() {
	    return yield* removeElement('shift');
	};
	this.pop = function*() {
	    return yield* removeElement('pop');
	};
	this.hash = function*() {
	    switch(seq.length) {
	    case 0:
		return '';
	    case 1:
		if(typeof seq[0] === 'string') {
		    return seq[0];
		} else {
		    return yield* store(seq[0]);
		}
	    default:
		return yield* store(seq);
	    }
	};
    }
    function* store(obj) {
	var hash = vercast.ObjectMonitor.seal(obj);
	yield* kvs.store(hash, JSON.stringify(obj));
	return hash;
    }
};
