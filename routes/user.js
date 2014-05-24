var scrypt = require("scrypt");
var db = require('../lib/db.js');
var MAX_TIME = 0.1;
var jwt = require('jsonwebtoken');
var authenticationMiddleware = require('../lib/authentication-middleware');
var async = require('async');
var getUserCollection = function () {
    return db.getDb().collection('user');
};

var NO_PASSWORD_SPECIFIED = 'no password specified';
var NO_USERNAME_SPECIFIED = 'no username specified';
var USER_ALREADY_EXISTS = 'user already exists';
var PASSWORD_TOO_SHORT = 'password too short';
var INVALID_EMAIL_ADDRESS = 'invalid email address';
var INVALID_USERNAME = 'invalid user name';

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
            var requestParams = req.body;

            var profile = {};
            async.waterfall([
                function (callback) {
                    if (!requestParams.password) {
                        callback('no password specified');
                    } else {
                        callback();
                    }
                },
                function (callback) {
                    getUserCollection().findOne({$or: [{ username: requestParams.email }, { email: requestParams.email }]}, function (err, user) {
                        if (!user) {
                            err = "user not found";
                        }
                        callback(err, user);
                    });
                }, function (user, callback) {
                    scrypt.verifyHash(user.hash, requestParams.password, callback);
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
                        callback(NO_PASSWORD_SPECIFIED);
                    } else if (requestParams.password.length < 8) {
                        callback(PASSWORD_TOO_SHORT);
                    } else if (!requestParams.username || requestParams.username.length < 1) {
                        callback(NO_USERNAME_SPECIFIED);
                    } else if (requestParams.username.indexOf('@') > -1) {
                        callback(INVALID_USERNAME);
                    } else if (requestParams.email && (requestParams.email.indexOf('@') < 0 || requestParams.email.length < 3)) {
                        callback(INVALID_EMAIL_ADDRESS);
                    } else {
                        callback();
                    }
                },
                function (callback) {
                    getUserCollection().count({$or: [{ username: requestParams.username }, { email: requestParams.email }]}, function(err, count) {
                        if (count !== 0) {
                            err = USER_ALREADY_EXISTS;
                        }
                        callback(err);
                    });
                },
                function (callback) {
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
                    console.log(err);
                    if (!err) {
                        res.json({ message: 'account created'});
                    } else if (err === USER_ALREADY_EXISTS) {
                        res.json(403, { message: 'user already exists!'});
                    } else if (err === NO_PASSWORD_SPECIFIED) {
                        res.json(400, { message: 'no password specified'});
                    } else if (err === NO_USERNAME_SPECIFIED) {
                        res.json(400, { message: 'no username specified'});
                    } else if (err === PASSWORD_TOO_SHORT) {
                        res.json(400, { message: 'password must be 8 characters or longer'});
                    } else if (err === INVALID_EMAIL_ADDRESS) {
                        res.json(400, { message: 'invalid email address'});
                    } else if (err === INVALID_USERNAME) {
                        res.json(400, { message: 'invalid username'});
                    } else {
                        res.json(500, { message: 'general error'});
                    }
            });
        }
    }
};
