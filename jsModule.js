"use strict";

var cache = Object.create(null);

exports.loadModule = function*(ctx, rootID, key) {
    var ver = (yield* ctx.trans(rootID, {_type: '_get_ver', _key: key})).r;
    if(ver.$ in cache) {
	return cache[ver.$];
    }
    var code = (yield* ctx.trans(ver, {_type: 'get'})).r;
    var globals = Object.keys(global);
    var func = new Function(['exports'].concat(globals), code);
    var module = {};
    func(module);
    cache[ver.$] = module;
    return module;
};
