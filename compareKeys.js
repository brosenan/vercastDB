"use strict";

function compareKeys(key1, key2) {
    if(Array.isArray(key1) && !Array.isArray(key2)) return 1;
    else if(!Array.isArray(key1) && Array.isArray(key2)) return -1;
    else if(Array.isArray(key1) && Array.isArray(key2)) {
	return compareArrays(key1, key2);
    } else if(key1 < key2) return -1;
    else if(key1 > key2) return 1;
    else return 0;
};
function compareArrays(arr1, arr2) {
    var i;
    for(i = 0; i < Math.min(arr1.length, arr2.length); i += 1) {
	var res = compareKeys(arr1[i], arr2[i]);
	if(res !== 0) {
	    return res;
	}
    }
    return compareKeys(arr1.length, arr2.length);
}

module.exports = compareKeys;