var MongoClient = require('mongodb').MongoClient;

var dbs = {};

module.exports = function() {

    MongoClient.connect('mongodb://localhost/ten20home', function(err, db) {

        if(err) {
          console.error('connect to db failed, app exits!');
          process.exit(0);
        }

        console.log('api connected to db ten20home...');
        dbs['user'] = db.collection('user');

        MongoClient.connect('mongodb://localhost/ten20api', function(err, db) {

          if(err) {
            console.error('connect to ten20api failed, app exits!');
            process.exit(0);
          }

          console.log('api connected to db ten20api...');
          dbs['tracker'] = db.collection('tracker');

          return dbs;
        });
   });
};
