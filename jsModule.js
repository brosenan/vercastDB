"use strict";
exports.loadModule = function*(ctx, rootID, key) {
    var code = (yield* ctx.trans(rootID, {_type: 'get', _key: key})).r;
    var globals = Object.keys(global);
    var func = new Function(['exports'].concat(globals), code);
    var module = {};
    func(module);
    return module;
};
