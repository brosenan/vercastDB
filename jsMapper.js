"use strict";

var vdb = require('vercastDB');

exports.init = function*(ctx, args) {
    this.rootID = args.rootID;
    this.key = args.key;
    this.name = args.name;
};
exports.map = function*(ctx, p, u) {
    var module = yield* vdb.loadModule(ctx, this.rootID, ctx.clone(this.key));
    var res = module[this.name](p.key, p.value);
    return res;
};