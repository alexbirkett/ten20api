db = require('../lib/db');


module.exports = {
    'collection-admin': {
        ':id': {
            delete: function(req, res) {
                db.getDb().dropCollection(req.params.id, function(err) {
                    if (err) {
                        var message = {message: err.errmsg};
                        if (err.errmsg === 'ns not found') {
                            res.json(404, message);
                        } else {
                            res.json(500, message);
                        }
                    } else {
                        res.json({});
                    }
                });
            }
        }
    }


}