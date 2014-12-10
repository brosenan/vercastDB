"use strict";
var DiffMatchPatch = require('diff-match-patch');

var dmp = new DiffMatchPatch();
var vdb = require('./index.js');

function AND(x, y) { return x && y; }

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
    if(!res[1].reduce(AND, true)) {
	ctx.conflict("Textual conflict");
    }
    this.text = res[0];
};
