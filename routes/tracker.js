var dbs  = require('../db')();

module.exports = {
    tracker: {
        message: {
            get: {
                handler: function (req, res) {
                    res.send("respond with a resource");
                }
            }
        },
        connected: {
            get: function (req, res) {
                res.send("respond with a resource");
            }
        },
        disconnected: {
            get: function (req, res) {
                res.send("respond with a resource");
            }
        }
    }

};
