/**
 * Created by alex on 18/01/14.
 */

var gotTopProtocol = require('../protocols/gotop.js');

module.exports = {

    protocols: {
        ":id": {
            get: function (req, res) {
                res.json(gotTopProtocol);
            }
        }
    }

};
