var dbs  = require('../db')();

module.exports = {
    trackers: {
        get: {
            handler: function (req, res) {
                res.send("return collection trackers associated with user");
            }
        },
        put: {
            handler: function (req, res) {
                res.send("replace entire collection of trackers associated with user");
            }
        },
        post:{
            handler: function (req, res) {
                res.send("create a new tracker and associated it with user");
            }
        },
        delete: {
            handler: function (req, res) {
                res.send("delete entire collection associated with user");
            }
        },
        ":id": {
            get: {
                handler: function (req, res) {
                    res.send("retrieve a representation of " + req.params.id );
                }
            },
            put: {
                handler: function (req, res) {
                    res.send("Replace " + req.params.id + ", or if it doesn't exist, create it.");
                }
            },
            delete: {
                handler: function (req, res) {
                    res.send("Delete " + req.params.id);
                }
            }
        }
    }

};
