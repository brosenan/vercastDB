"use strict";
module.exports = function() {
    var store = Object.create(null);
    this.store = function*(key, val) {
	store[key] = val;
    };
    this.fetch = function*(key) {
	return store[key];
    };
};