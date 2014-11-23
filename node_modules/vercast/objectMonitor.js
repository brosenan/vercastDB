"use strict";

var crypto = require('crypto');

module.exports = function(obj) {
    var dirtyCounter = 0;
    var cleanValue = 0;
    var hashCounter = -1;
    var jsonCounter = -1;

    this.proxy = function() {
	var props = {};
	Object.keys(obj).forEach(function(key) {
	    props[key] = createProxyProperty(key);
	});
	var proxy = Object.create(null, props);
	proxy.__childProxies = {};
	proxy._replaceWith = function(newObj) {
	    obj = newObj;
	    dirtyCounter += 1;
	};
	Object.freeze(proxy);
	return proxy;
    };
    this.isDirty = function() { 
	var lastClean = cleanValue;
	cleanValue = dirtyCounter;
	return lastClean !== dirtyCounter;
    };
    this.hash = function() {
	if(hashCounter === dirtyCounter) {
	    return this.lastHash;
	}
	hashCounter = dirtyCounter;
	this.lastHash = calcHash(obj, this);
	return this.lastHash;
    };
    this.revision = function() {
	return dirtyCounter;
    };
    this.json = function() {
	if(jsonCounter === dirtyCounter) {
	    return this.lastJson;
	}
	jsonCounter = dirtyCounter;
	this.lastJson = JSON.stringify(obj);
	return this.lastJson;
    };
    this.object = function() {
	return obj;
    };
    
    function createProxyProperty(key) {
	return {
	    enumerable: true,
	    get: function() {
		var child = obj[key];
		if(child && typeof child === 'object' && typeof child.$ !== 'string') {
		    if(!this.__childProxies[key]) {
			this.__childProxies[key] = new MapProxy(child);
		    }
		    return this.__childProxies[key];
		} else {
		    return child;
		}
	    },
	    set: function(value) {
		obj[key] = value; 
		dirtyCounter += 1; 
	    },
	};
    }
    function MapProxy(obj) {
	this.__childProxies = {};
	this.get = function(key) {
	    var child = obj[key];
	    if(child && typeof child === 'object' && typeof child.$ !== 'string') {
		if(!this.__childProxies[key]) {
		    this.__childProxies[key] = new MapProxy(child);
		}
		return this.__childProxies[key];
	    } else {
		return child;
	    }
	};
	this.put = function(key, value) {
	    obj[key] = value;
	    dirtyCounter += 1;
	}
	Object.freeze(this);
    }
}

function calcHash(obj, monitor) {
    var hash = crypto.createHash('sha256');
    var str;
    if(monitor) {
	str = monitor.json();
    } else {
	str = JSON.stringify(obj);
    }
    hash.update(str);
    return hash.digest('base64')
}

module.exports.seal = function(obj) {
    if(Object.isFrozen(obj) && typeof obj.$ === 'string') {
	return obj.$;
    }
    obj.$ = calcHash(obj);
    Object.freeze(obj);
    return obj.$;
};