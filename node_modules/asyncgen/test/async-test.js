// This comment is at the beginning of this file
var assert = require('assert');

var asyncgen = require('../async');

describe('asyncgen', function(){
    it('should allow "standard" functions to be yielded', function(done){
	var fs = require('fs');
	var readFile = asyncgen.thunkify(fs.readFile);
	asyncgen.run(function*() {
	    var content = yield readFile(__dirname + '/async-test.js', 'utf-8');
	    return content.split('\n')[0];
	}, function(err, res) {
	    assert.ifError(err);
	    assert.equal(res, '// This comment is at the beginning of this file');
	    done();
	});
    });
    it('should propagate errors to the generator function', function(done){
	var fs = require('fs');
	var readFile = asyncgen.thunkify(fs.readFile);
	asyncgen.run(function*() {
	    try {
		var content = yield readFile('fileThatDoesNotExist.txt');
		assert(false, 'We should not be here');
	    } catch(e) {
		assert.equal(e.message, "ENOENT, open 'fileThatDoesNotExist.txt'");
	    }
	}, done);
    });
    it('should propagate exceptions unhandled by the generator function to the run callback', function(done){
	var fs = require('fs');
	var readFile = asyncgen.thunkify(fs.readFile);
	asyncgen.run(function*() {
	    throw Error('foo');
	}, function(err, content) {
	    try {
		assert.equal(err.message, "foo");
		done();
	    } catch(e) {
		done(e);
	    }
	});
    });

    it('should propagate exceptions unhandled by the generator function to the run callback', function(done){
	var fs = require('fs');
	var readFile = asyncgen.thunkify(fs.readFile);
	asyncgen.run(function*() {
	    try{
		var content = yield readFile('fileThatDoesNotExist.txt', 'utf-8');
	    } catch(e) {
		throw e;
	    }
	}, function(err, content) {
	    try {
		assert.equal(err.message, "ENOENT, open 'fileThatDoesNotExist.txt'");
		done();
	    } catch(e) {
		done(e);
	    }
	});
    });

    describe('.async(genfunc)', function(){
	it('should return an asynchronous function executing the generator', function(done){
	    var fs = require('fs');
	    var readFile = asyncgen.thunkify(fs.readFile);
	    function* readFirstLine() {
		var content = yield readFile(__dirname + '/async-test.js', 'utf-8');
		return content.split('\n')[0];
	    }
	    var readFirstLineAsync = asyncgen.async(readFirstLine);
	    readFirstLineAsync(function(err, line) {
		assert.ifError(err);
		assert.equal(line, '// This comment is at the beginning of this file');
		done();
	    })
	});
	it('should return a function whos toString() method returns the code of the generator function', function(){
	    function* foo() { return "hello"; }
	    var asyncfunc = asyncgen.async(foo);
	    assert.equal(asyncfunc.toString(), foo.toString());
	});
    });
    describe('.parallel(generators)', function(){
	it('should execute the given generator functions', asyncgen.async(function*(){
	    var done1 = false, done2 = false;
	    function* do1() {
		done1 = true;
	    }
	    function* do2() {
		done2 = true;
	    }
	    yield* asyncgen.parallel([do1(), do2()]);
	    assert(done1, 'do1() should have run');
	    assert(done2, 'do2() should have run');
	}));
	it('should run the given generator in parallel', asyncgen.async(function*(){
	    function* wait() {
		yield function(_) { setTimeout(_, 5); };
	    }
	    var timeBefore = Date.now();
	    yield* asyncgen.parallel([wait(), wait(), wait(), wait()]);
	    var timeAfter = Date.now();
	    assert(timeAfter - timeBefore < 7, 'Overall waiting time should be considerably less than four times the wait');
	}));
	it('should return an array containing the generators respective return values', asyncgen.async(function*(){
	    function* waitAndRet(value) {
		yield function(_) { setTimeout(_, 1); };
		return value;
	    }
	    var res = yield* asyncgen.parallel([waitAndRet(1), 
						waitAndRet(2), 
						waitAndRet(3), 
						waitAndRet(4)]);
	    assert.deepEqual(res, [1, 2, 3, 4]);
	}));
	it('should propagate the exception if one of the generators throws', asyncgen.async(function*(){
	    function* wait() {
		yield function(_) { setTimeout(_, 1); };
	    }
	    function* raise() {
		yield* wait();
		var e = Error('This is an exception');
		e.isMyException = true;
		throw e;
	    }

	    try {
		yield* asyncgen.parallel([wait(), wait(), raise(), wait()]);
		assert(false, 'previos statement should fail');
	    } catch(e) {
		if(!e.isMyException) {
		    throw e;
		}
	    }
	}));
    });
});
