"use strict";

exports.init = function*() { this.value = 0; };
exports.add = function*(ctx, p, u) {
    this.value += (u?-1:1) * p.amount;
    return this.value;
};