var scrypt = require("scrypt");
var passport = require('passport');
var db = require('../lib/db.js');
var maxtime = 0.1;
var jwt = require('jsonwebtoken');
var authenticationMiddleware = require('../lib/authentication-middleware');
var async = require('async');
var getUserCollection = function () {
    return db.getDb().collection('user');
};

var secret = 'shhhhhhared-secret';


module.exports = {

    user: {
        info: {
            get: function (req, res) {
                console.log(req.user);
                res.json(req.user);
            }
        },
        use: authenticationMiddleware.middlewareFunction,
        useOld: function (req, res, next) {
            if (req.isAuthenticated()) {
                next();
            } else {
                res.json(401, {message: 'not logged in'});
            }
        }
    },
    signin: {
        post: function (req, res, next) {
            var userInfo = req.body;
            if (userInfo.remember) {
                req.session.cookie.maxAge = 2592000000; // 30*24*60*60*1000 Rememeber 'me' for 30 days
            } else {
                req.session.cookie.expires = false;
            }

            passport.authenticate('local', function (err, user, info) {
                if (err) {
                    return next(err)
                }
                if (!user) {
                    return res.json(401, info);
                }
                req.logIn(user, function (err) {
                    if (err) {
                        return next(err);
                    }
                    res.json({message: ''});
                });
            })(req, res, next);
        }
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
    signout: {
        get: function (req, res) {
            req.logout();
            res.redirect('/');
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
