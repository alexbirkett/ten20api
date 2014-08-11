var scrypt = require("scrypt");
var db = require('../lib/db.js');
var crypto = require('crypto');
var async = require('async');
var maxtime = 0.1;

var findObjects = function (query, callback) {
    var cursor = getUserCollection().find(query, {});
    cursor.toArray(function (err, docs) {
        callback(err, docs);
    });
};

var getUserCollection = function () {
    return db.getDb().collection('user');
};

var updateObject = function (query, object, callback) {
    getUserCollection().update(query, { $set: object }, { upsert: false}, callback);
}

var findAndModify = function (query, object, callback) {
    getUserCollection().findAndModify(query, null, { $set: object }, { new: true, upsert: false }, callback);
};

module.exports = function () {
    return {
        reset_password: {

            generate_token: {
                ":usernameOrEmail": {
                    get: function (req, res) {

                        async.waterfall([function (callback) {
                            crypto.randomBytes(48, callback);
                        }, function (tokenBuffer, callback) {
                            var token = tokenBuffer.toString('hex');
                            findAndModify({$or: [
                                { email: req.params.usernameOrEmail},
                                { username: req.params.usernameOrEmail }
                            ] }, {token: token}, callback);
                        }], function (err, results) {
                            if (err) {
                                res.json(500, {});
                            } else if (!results) {
                                res.json(404, { message: "user not found"});
                            } else {
                                var response = {
                                    email: results.email,
                                    token: results.token
                                }
                                res.json(response);
                            }
                        });
                    }
                }
            },

            put: function (req, res) {
                var userInfo = req.body;
                async.waterfall([function (callback) {
                    scrypt.passwordHash(userInfo.password, maxtime, callback);
                }, function (hash, callback) {
                    updateObject({token: userInfo.token}, { hash: hash, token: undefined}, callback);
                }], function (err, results, other) {
                    if (err) {
                        res.json(500, {});
                    } else if (results === 1) {
                        res.json({});
                    } else {
                        res.json(404, { message: "token not found"});
                    }
                });
            }

        }
    }
};
