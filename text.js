"use strict";
var DiffMatchPatch = require('diff-match-patch');

var dmp = new DiffMatchPatch();
var vdb = require('./index.js');

function AND(x, y) { return x && y; }
dmp.Match_Threshold = 0;
dmp.Patch_DeleteThreshold = 0;

exports.init = function*(ctx, args) {
    this.text = args.text;
};

exports.get = function*(ctx, p, u) {
    return this.text;
};

exports.patch = function*(ctx, p, u) {
    var patch = dmp.patch_fromText(p.patch);
    if(u) {
	patch = vdb.textutil.revertPatches(patch);
    }
    var res = dmp.patch_apply(patch, this.text);
    //console.log(this.text, patch[0], res);
    if(!res[1].reduce(AND, true)) {
	ctx.conflict("Textual conflict");
    }
    this.text = res[0];
};

exports.put = function*(ctx, p, u) {
    var patch = dmp.patch_make(this.text, p.value);
    return {_reapply: {
	_type: 'patch',
	patch: dmp.patch_toText(patch),
    }};
};