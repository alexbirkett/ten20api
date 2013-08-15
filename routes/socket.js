/*
 * Serve content over a socket
 */

var trackersTest = require('../test/trackerData.json');

module.exports = function (socket) {
  var user =  {};
  var trackers = {};

  function initTrackers(cb) {
    for (var i = 0; i < user.trackers.length; i++) {
      user.trackers[i];
    };
  }

  console.log('socket connected!');

  // initialize user and trackers info
  socket.on('init:start', function(data) {

    socket.emit('init:ok', {
      user: { name: "Daniel" },
      trackers: trackersTest
    });

    /*TODO
    db.user.findOne({_id: data}, function(error, user) {
      if (error) {
        socket.disconnect();
        console.error('disconnected');
      } else {
        user = user;
        initTrackers(function() {
          socket.emit('init:ok', {trackers: trackers});
        });
      }
    });
    */
  });

  // get trackers current location info
  socket.on('get:current', function(trackers) {
    //TODO
    var current = [];

    for (var i = 0; i < trackers.length; i++) {
      current.push({
        trackerIndex: trackers[i].index,
        data: getCurrent(trackers[i].index, trackers[i].serial)
      });
    };

    socket.emit('send:current', current);
  });

  // get trackers current location info
  socket.on('get:history', function(tracker) {
    //TODO
    var history = { trackerIndex: tracker.index };

    history.data = getHistory(tracker.serial, tracker.date);
    socket.emit('send:history', history);
  });

  setInterval(function () {
    var now = (new Date()).toLocaleString().split(' ');

    delete now[3];
    delete now[5];
    delete now[6];
    
    socket.emit('send:timeWeather', {
      city: 'oslo',
      weather: 'sunny',
      temperature: '5°C',
      time: now.join(' ')
    });
  }, 1000);

  //TODO
  function getCurrent(index, serial) {

    var hour = ('0' + (new Date()).getHours()).slice(-2);
    var minute = ('0' + (new Date()).getMinutes()).slice(-2);
    var elevation = Math.floor(Math.random()*50);
    var speed = Math.floor(Math.random()*20);
    var latRan = Math.random() * 0.0002;
    var lngRan = Math.random() * 0.0005;
    var latlng = [
                    {lat: 52.80113, lng: -1.63130},
                    {lat: 52.81213, lng: -1.65230},
                    {lat: 52.79013, lng: -1.62330}
                 ][index];

    return {
      "fence": "ON 7 km",
      "actTime": "Today " +  hour + ":" + minute,
      "elevation": elevation + ' km',
      "speed":  speed + ' km/h',
      "latlng":[latlng.lat + latRan, latlng.lng + lngRan]
    };
  }

  //TODO
  function getHistory(serial, date) {
  }
};
