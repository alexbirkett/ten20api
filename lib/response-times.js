

var ResponseTimes = function(maxSize) {
    this.maxSize = maxSize;
    this.times = []
}


ResponseTimes.prototype.addTime = function(time) {
    this.times.push(time);
    if (this.times.length > this.maxSize) {
        this.times.shift();
    }
};

ResponseTimes.prototype.calculateAverage = function() {
    var sum = 0;
    this.times.forEach(function(time) {
        sum += time;
    });
    return sum / this.times.length;
};

module.exports = ResponseTimes;