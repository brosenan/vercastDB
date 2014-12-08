"use strict";
var DiffMatchPatch = require('diff-match-patch');

var dmp = new DiffMatchPatch();

var text1 = "Hi there, I am a pirate!!!";
var text2 = "Hello there, I am a robot";

var patch = dmp.patch_make(text1, text2);
console.log(JSON.stringify(patch));
