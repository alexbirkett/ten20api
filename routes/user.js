var scrypt = require("scrypt");
var passport = require('passport');
var maxtime = 0.1;
var userCollection;

exports.setDb = function (db) {
    userCollection = db.collection('user');
};

// Simple route middleware to ensure user is authenticated.  Otherwise send to login page.
exports.ensureAuthenticated = function ensureAuthenticated(req, res, next) {
    if (req.isAuthenticated()) {
        next();
    } else {
        res.redirect('/#signin');
    }
};

exports.console = {

    user: {
        info: {
            get: function (req, res) {
                res.json(req.user);
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
                    return res.json(info);
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
    signout: {
        get: function (req, res) {
            req.logout();
            res.redirect('/');
        }
    },
    signup: {
        post: function (req, res) {
            var userInfo = req.body;

            userCollection.findOne({email: userInfo.email}, function (error, user) {
                if (!error) {
                    if (!user) {
                        scrypt.passwordHash(userInfo.password, maxtime, function (err, pwdhash) {
                            if (!err) {
                                //pwdhash should now be stored in the database
                                userInfo.hash = pwdhash;
                                delete userInfo.password;
                                delete userInfo.rememberMe;
                                userCollection.insert(userInfo, function (error, docs) {
                                    req.login(userInfo, function (err) {
                                        if (err) {
                                            return next(err);
                                        }
                                        return res.json({message: ''});
                                    });
                                });
                            } else {
                                res.json({message: 'server interal error!'});
                            }
                        });
                        // already exist username
                    } else {
                        res.json({message: 'username already exists!'});
                    }
                } else {
                    res.json({message: 'server interal error!'});
                }
            });
        }
    }
};
