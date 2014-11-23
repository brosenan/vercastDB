"use strict";

module.exports = function*(ctx, p, u) {
    var res = yield* ctx.trans(ctx.self(), p.patch, !u);
    this._replaceWith(res.v);
    return res.r;
};