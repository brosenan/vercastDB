"use strict";

function revertDiff(diff) {
    return [-diff[0], diff[1]];
}

function revertPatch(patch) {
    return {diffs: patch.diffs.map(revertDiff),
	    start1: patch.start2,
	    start2: patch.start1,
	    length1: patch.length2,
	    length2: patch.length1};
}

exports.revertPatches = function(patches) {
    return patches.map(revertPatch);
};