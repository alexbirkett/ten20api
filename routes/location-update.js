var db = require('../lib/db');

var getObjectCollection = function() {
    return db.getDb().collection('trackers');
};

var updateTracker = function(serial, location, callback) {
    var query = { serial: serial};
    var data = { $set: location };
    getObjectCollection().update(query, data, callback);
}

module.exports =
{
    location: {
        ":id" : {
            post: function (req, res) {
                console.log(req.params.id);

                updateTracker(req.params.id, req.body, function(err) {
                    if (err) {
                        res.json(500, {});
                    } else {
                        res.json({});
                    }

                });
            }
        }
    }
};