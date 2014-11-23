var util = require('/home/boaz/vercast-1/util.js');

module.exports = function() {
    var G = {};
    this.clear = function*() {
	G = {};
    };
    
    function mapEdge(src, label, dest, dir) {
	var v = G[src];
	if(!v) {
	    v = {i: {}, o: {}};
	    G[src] = v;
	}
	if(dir) {
	    v.o[label] = dest;
	} else {
	    v.i[label] = dest;
	}
    }

    this.addEdge = function*(src, label, dest) { 
	//console.log(src, '--', label, '->', dest);
	mapEdge(src, label, dest, true);
	mapEdge(dest, label, src, false);
    };
    this.queryEdge = function*(src, label) {
	return G[src].o[label];
    };
    this.queryBackEdge = function*(dest, label) {
	return G[dest].i[label];
    };
    this.findCommonAncestor = function*(node1, node2) {
	var res = this.bfs(node1, function(node, path) {
	    var res = {};
	    var i = 0;
	    while(i < path.length && !path[i].d) i++;
	    while(i < path.length && path[i].d) i++;
	    if(i < path.length) res.prune = true;
	    else if(node == node2) {
		res.include = true;
		res.done = true;
	    }
	    return res;
	});
	if(res.length > 0) {
	    var node = node1;
	    var path = res[0].p;
	    var i = 0;
	    var p1 = [];
	    while(i < path.length && !path[i].d) {
		p1.unshift({l: path[i].l, n: node});
		node = G[node].i[path[i].l];
		i++;
	    }
	    var p2 = [];
	    while(i < path.length) {
		p2.push({l: path[i].l, n: path[i].n});
		i++;
	    }
	    return {node: node, p1: p1, p2: p2};
	} else {
	    throw Error('No path found from ' + node1 + ' to ' + node2);
	}
    };
    this.print = function() { console.log(G); };
    this.bfs = function(start, eval) {
	var results = [];
	var q = [{n: start, p: []}];
	while(q.length > 0) {
	    var curr = q.shift();
	    var res = eval(curr.n, curr.p);
	    if(res.include) results.push(curr);
	    if(res.prune) continue;
	    if(res.done) break;
	    for(var l in G[curr.n].o) {
		q.push({n: G[curr.n].o[l], p: curr.p.concat([{l:l, n:G[curr.n].o[l], d:true}])});
	    }
	    for(var l in G[curr.n].i) {
		q.push({n: G[curr.n].i[l], p: curr.p.concat([{l:l, n:G[curr.n].i[l], d:false}])});
	    }
	}
	return results;
    };
    this.findPath = function*(x, y) {
	var self = this;
	//yield function(_) { setTimeout(_, 0); };
	var res = self.bfs(x, function(node, path) {
	    var res = {};
	    var i = 0;
	    // Go forwards only
	    while(i < path.length && path[i].d) i++;
	    if(i < path.length) res.prune = true;
	    else if(node == y) {
		res.include = true;
		res.done = true;
	    }
	    return res;
	});
	if(res.length > 0) return pathLabels(res[0].p);
	else throw Error('Could not find path from ' + x + ' to ' + y);
    };
    this.abolish = function() {
	G = {};
    }
    this.dump = function() {
	console.log(G);
    }
};

function pathLabels(path) {
    var labels = [];
    for(var i = 0; i < path.length; i++) {
	labels.push(path[i].l);
    }
    return labels;
}
