"use strict";
module.exports = function() {
    var kvs = Object.create(null);
    this.abolish = function*() {
	kvs = Object.create(null);
    };
    this.newKey = function*(key, value) {
	return yield* this.modify(key, value);
    };
    this.retrieve = function*(key) {
	return kvs[key];
    };
    this.modify = function*(key, value) {
	setTimeout(function() {
	    kvs[key] = value; // this will happen after the function returns
	}, 3);
    };
};