var MongoClient = require('mongodb').MongoClient;
var data = require('./test/demoData');

var dbs = {};

module.exports = function() {

  MongoClient.connect('mongodb://localhost/ten20home', function(err, db) {

    if(err) {
      console.error('connect to db ten20home failed, app exits!');
      process.exit(0);
    }

    console.log('api connected to db ten20home...');
    
    dbs['user'] = db.collection('user');
    // update demo user
    dbs['user'].update({ email: 'test@ten20live.com' },
        {trackers: ["2384390", "2384391"], email: 'test@ten20live.com'}, 
        { upsert : true }, function() {}
    );

    MongoClient.connect('mongodb://localhost/ten20api', function(err, db) {

      if(err) {
        console.error('connect to ten20api failed, app exits!');
        process.exit(0);
      }

      console.log('api connected to db ten20api...');

      dbs['tracker'] = db.collection('tracker');
      dbs['history'] = db.collection('history');

      // insert demo tracker data
      for (var i = 0; i < data.trackerData.length; i++) {
        dbs['tracker'].update(
          { id: data.trackerData[i].id },
          { $set : data.trackerData[i] },
          { upsert : true }, function() {}
        );
      };

      dbs['history'].update(
        { trackerSerial: data.historyData.trackerSerial },
        { $set : data.historyData },
        { upsert : true }, function() {}
      );

    });
  });

  return dbs;
};
