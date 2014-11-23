module.exports = function() {
    var data = {};
    this.clear = function*() {
	data = {};
    };
    this.newKey = function*(key, val) {
	if(key in data) {
	    throw Error('Key ' + key + ' already exists');
	}
	data[key] = val;
    };
    this.retrieve = function*(key) {
	if(!(key in data)) {
	    throw Error('Key ' + key + ' was not found');
	}
	var value = data[key]
	yield function(_) { setTimeout(_, 1); };
	return value;
    };
    this.modify = function*(key, oldVal, newVal) {
	if(data[key] != oldVal) {
	    return data[key];
	}
	data[key] = newVal;
	return newVal;
    };
    this.abolish = function() {
	data = {};
    }
};
