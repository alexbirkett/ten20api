

var process = function(key, object) {
    if (key === 'timestamp' || key === 'startTime' || key === 'endTime') {
        object[key] = new Date(object[key]);
    }
};

var traverse = function(object, func) {
    for (var key in object) {
        var value = object[key];
        func(key, object);
        if (value !== null && typeof(value) === "object") {
            traverse(value, func);
        }
    }
};

module.exports = function(object) {
     traverse(object, process);
     return object;
};