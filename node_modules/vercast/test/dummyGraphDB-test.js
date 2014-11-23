"use strict";
var vercast = require('vercast');

describe('DummyGraphDB', function(){
    require('./graphDB-test.js')(new vercast.DummyGraphDB());
});
