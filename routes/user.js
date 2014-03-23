var scrypt = require("scrypt");
var db = require('../lib/db.js');
var maxtime = 0.1;
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
                console.log(req.user);
                res.json(req.user);
            }
        },
        use: authenticationMiddleware.middlewareFunction
    },
    authenticate: {
        post: function (req, res) {
            console.log(req.headers);
            var userInfo = req.body;

            var profile = {};

            console.log(userInfo);
            async.waterfall([function (callback) {
                getUserCollection().findOne({ email: userInfo.email}, callback);
            }, function (user, callback) {
                scrypt.verifyHash(user.hash, userInfo.password, callback);
                profile._id = user._id;
            }, function (isMatch, callback) {
                callback(isMatch ? undefined : 'invalid password');
            }],
                function (err) {
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
            var userInfo = req.body;

            getUserCollection().findOne({email: userInfo.email}, function (error, user) {
                if (!error) {
                    if (!user) {
                        scrypt.passwordHash(userInfo.password, maxtime, function (err, pwdhash) {
                            if (!err) {
                                //pwdhash should now be stored in the database
                                userInfo.hash = pwdhash;
                                delete userInfo.password;
                                delete userInfo['re-password'];
                                delete userInfo.rememberMe;
                                getUserCollection().insert(userInfo, function (error, docs) {
                                    res.json({});
                                });
                            } else {
                                res.json(500, {message: 'server interal error!'});
                            }
                        });
                        // already exist username
                    } else {
                        res.json(403, {message: 'username already exists!'});
                    }
                } else {
                    res.json(500, {message: 'server interal error!'});
                }
            });
        }
    }
};
