var scrypt = require("scrypt");
var db = require('../lib/db.js');
var MAX_TIME = 0.1;
var jwt = require('jsonwebtoken');
var authenticationMiddleware = require('../lib/authentication-middleware');
var async = require('async');
var getUserCollection = function () {
    return db.getDb().collection('user');
};

module.exports = {

    user: {
        info: {
            get: function (req, res) {
                res.json(req.user);
            }
        },
        use: authenticationMiddleware.middlewareFunction
    },
    authenticate: {
        post: function (req, res) {
            var userInfo = req.body;

            var profile = {};
            async.waterfall([
                function (callback) {
                    if (!userInfo.password) {
                        callback('no password specified');
                    } else {
                        callback();
                    }
                },
                function (callback) {
                    getUserCollection().findOne({ email: userInfo.email}, function (err, user) {
                        if (!user) {
                            err = "user not found";
                        }
                        callback(err, user);
                    });
                }, function (user, callback) {
                    scrypt.verifyHash(user.hash, userInfo.password, callback);
                    profile._id = user._id;
                }, function (isMatch, callback) {
                    callback(isMatch ? undefined : 'invalid password');
                }], function (err) {
                if (err) {
                    res.json(401, { message: 'Invalid password' });
                } else {
                    var token = jwt.sign(profile, authenticationMiddleware.secret, { expiresInMinutes: 60 * 5 });
                    res.json({ token: token });
                }
            });

        }
    },
    signup: {
        post: function (req, res) {
            var requestParams = req.body;
            async.waterfall([
                function (callback) {
                    if (!requestParams.password) {
                        callback('no password specified');
                    } else {
                        callback();
                    }
                },
                function (callback) {
                    getUserCollection().findOne({ email: requestParams.email }, function(err, user) {
                        if (user) {
                            err = "user already exists";
                        }
                        callback(err, user);
                    });
                },
                function (user, callback) {
                    scrypt.passwordHash(requestParams.password, MAX_TIME, callback);
                },
                function (pwdhash, callback) {
                    var userObject = {
                        email: requestParams.email,
                        username: requestParams.username,
                        hash: pwdhash
                    };
                    getUserCollection().insert(userObject, callback);
                }],
                function (err) {
                    if (err) {
                        res.json(403, {message: 'user already exists!'});
                    } else {
                        res.json({});
                    }
            });
        }
    }
};
