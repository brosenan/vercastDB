asyncgen
========

A support library for using es6 generators for asynchronous computations. This requires node >=0.11.2 and the --harmony flag enabled.


Installing
----------
    # git clone git@github.com:brosenan/asyncgen.git
    # cd asyncgen
    # npm install
    # npm test

Or allternatively,

    # npm install --save asyncgen
    # cd node_modules/asyncgen
    # npm test

Be sure you are using a compatible node version.  For example:
    # nvm use 0.11

What gives?
-----------
See [the spec](https://github.com/brosenan/asyncgen/blob/master/spec.md).

Acknowledgement
---------------
This  module is based on examples by [strongloop](https://github.com/strongloop/example-generators).  See [this blog](http://strongloop.com/strongblog/how-to-generators-node-js-yield-use-cases/).
