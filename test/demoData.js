// example data model for demo
function getDayTime () {
   var today = new Date();
   return (new Date(today.getFullYear(), today.getMonth() + 1, today.getDate())).valueOf();
}

module.exports = {
  trackerData :  [{
    "id": "2384390", // id in database
    "name": "Alex",
    "iconEmail": "alex@birkett.no", // see http://en.gravatar.com/site/implement/hash/
    "iconColor": "FF00FF",
    "serialNumber": "34234234234", // device serial number
    "lastUpdateTimestamp": (new Date()).valueOf(),
    "fence": "on 5km", // on *km, off
    "latitude": 52.80113,
    "longitude": -1.63130,
    "speed": "20", // km/h
    "course": "359", // degrees
    "gpsAvailable": true
  }, {
    "id": "2384391", // id in database
    "name": "Alex",
    "iconEmail": "alex@birkett.no", // see http://en.gravatar.com/site/implement/hash/
    "iconColor": "FF00FF",
    "serialNumber": "34234234235", // device serial number
    "lastUpdateTimestamp": (new Date()).valueOf(),
    "fence": "off", // on *km, off
    "latitude": 52.80323,
    "longitude": -1.61930,
    "speed": "10", // km/h
    "course": "13", // degrees
    "gpsAvailable": true
  }],

  historyData : {
    "trackerSerial": "34234234234",
    "date": getDayTime(),
    "data": [
    {
      "time": "09:00",
      "geodata": []
    },
    {
      "time": "10:00",
      "geodata": []
    },
    {
      "time": "11:00",
      "geodata": []
    },
    {
      "time": "12:00",
      "geodata": []
    },
    {
      "time": "13:00",
      "geodata": []
    }
    ]
  }
}
