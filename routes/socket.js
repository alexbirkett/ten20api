/*
 * Serve content over a socket
 */

function roundDate(miniseconds) {
   var today = new Date(miniseconds);
   return (new Date(today.getFullYear(), today.getMonth() + 1, today.getDate())).valueOf();
}

module.exports = function (socket) {

  console.log('socket connected!');

  // send trackers current location info
  socket.on('get:current', function(serials) {
    promise.getTrackers(serials).then(function(trackers) {
      socket.emit('send:current', trackers);
    });
  });

  // send trackers history location info
  socket.on('get:history', function(tracker) {
    var history = { trackerIndex: tracker.index };

    var reqDate = roundDate(tracker.date);
  });

  // broadcast time weather
  emitTimeWeather();

  function emitTimeWeather() {
    var now = (new Date()).toLocaleString().split(' ');
    // cut off seconds
    now[4] = now[4].split(':').slice(0, 2).join(':');

    delete now[3];
    delete now[5];
    delete now[6];

    socket.emit('timeWeather', {
      city: 'oslo',
      weather: 'sunny',
      temperature: '5°C',
      time: now.join(' ')
    });

    setTimeout(emitTimeWeather, 60 * 1000);
  }

};
