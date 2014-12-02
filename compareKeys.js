"use strict";

function isArray(obj) {
    return Array.isArray(obj) || 
	typeof obj === 'object' && 
	typeof obj.get === 'function';
}

function compareKeys(key1, key2) {
    if(isArray(key1) && !isArray(key2)) return 1;
    else if(!isArray(key1) && isArray(key2)) return -1;
    else if(isArray(key1) && isArray(key2)) {
	return compareArrays(key1, key2);
    } else if(key1 < key2) return -1;
    else if(key1 > key2) return 1;
    else return 0;
};
function compareArrays(arr1, arr2) {
    var i = 0;
    while(true) {
	var val1 = elem(arr1, i);
	var val2 = elem(arr2, i);
	if(typeof val1 === 'undefined' && typeof val2 === 'undefined') {
	    return 0;
	} else if(typeof val1 === 'undefined') {
	    return -1;
	} else if(typeof val2 === 'undefined') {
	    return 1;
	}
	var res = compareKeys(val1, val2);
	if(res !== 0) {
	    return res;
	}
	i += 1;
    }
    return compareKeys(arr1.length, arr2.length);

    function elem(arr, n) {
	if(Array.isArray(arr)) {
	    return arr[n];
	} else {
	    return arr.get(n);
	}
    }
}

module.exports = compareKeys;