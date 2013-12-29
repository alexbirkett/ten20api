

var FunctionCallCounter = function() {
    this.times = []
}


FunctionCallCounter.prototype.called = function(time) {
    this.times.push(new Date().getTime());
};

FunctionCallCounter.prototype.count = function() {
    var timeOneSecondAgo = (new Date().getTime()) - 1000;
    for (var i = this.times.length - 1; i > -1; i--) {
        var time = this.times[i];
        if (time < timeOneSecondAgo) {
            this.times.splice(i, 1 );
        }
    }

    return this.times.length;
};

module.exports = FunctionCallCounter;
