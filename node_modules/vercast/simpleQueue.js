module.exports = function() {
    this.queue = [];

    this.enqueue = function*(item) {
	this.queue.push(item);
    };
    this.dequeue = function*() {
	return this.queue.shift();
    };
    this.isEmpty = function*() {
	return this.queue.length == 0;
    };
};
