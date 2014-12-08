"use strict";
var DiffMatchPatch = require('diff-match-patch');

var dmp = new DiffMatchPatch();

exports.init = function*(ctx, args) {
    this.text = args.text;
};

exports.get = function*(ctx, p, u) {
    return this.text;
};

exports.patch = function*(ctx, p, u) {
    var patch = dmp.patch_fromText(p.patch);
    this.text = dmp.patch_apply(patch, this.text);
};
