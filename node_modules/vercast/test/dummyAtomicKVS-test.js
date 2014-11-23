"use strict";
var vercast = require('vercast');

describe('DummyAtomicKVS', function(){
    require('./atomicKeyValue-test.js')(new vercast.DummyAtomicKVS());
});
