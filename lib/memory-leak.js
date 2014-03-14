var memwatch = require('memwatch');
var heapdump = require('heapdump');

memwatch.on('leak', function (info) {
    console.log('leak');
    console.log(info);
});

hd = new memwatch.HeapDiff();

/*memwatch.on('stats', function(stats) {
    console.log('stats');
    console.log(stats);
    console.log(JSON.stringify(hd.end(), null, 4));
    hd = new memwatch.HeapDiff();
});*/

var printSnapShot = function() {
    setTimeout(function() {
        console.log(JSON.stringify(hd.end(), null, 4));
        hd = new memwatch.HeapDiff();
        heapdump.writeSnapshot();
        printSnapShot();
    }, 1000 * 60 * 15);
}
printSnapShot();


