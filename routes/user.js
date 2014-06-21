var scrypt = require("scrypt");
var db = require('../lib/db.js');
var MAX_TIME = 0.1;
var jsonwebtoken = require('jsonwebtoken');
var authenticationMiddleware = require('../lib/authentication-middleware');
var async = require('async');
var ObjectID = require('mongodb').ObjectID;

var getUserCollection = function () {
    return db.getDb().collection('user');
};

var NO_PASSWORD_SPECIFIED = 'no password specified';
var NO_USERNAME_SPECIFIED = 'no username specified';
var USER_ALREADY_EXISTS = 'user already exists';
var PASSWORD_TOO_SHORT = 'password too short';
var INVALID_EMAIL_ADDRESS = 'invalid email address';
var INVALID_USERNAME = 'invalid user name';

var sendResponseForError = function(res, err) {
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
};

var getErrorForPassword = function(password) {
    if (!password) {
        return NO_PASSWORD_SPECIFIED;
    } else if (password.length < 8) {
        return PASSWORD_TOO_SHORT;
    } else {
        return undefined;
    }
}

var getErrorForUserName = function(username) {
    if (!username || username.length < 1) {
        return NO_USERNAME_SPECIFIED;
    } else if (username.indexOf('@') > -1) {
        return INVALID_USERNAME;
    } else {
        return undefined;
    }
};

var getErrorForEmail = function(email) {
    // email is not required
    if (email && (email.indexOf('@') < 0 || email.length < 3)) {
        return INVALID_EMAIL_ADDRESS;
    } else {
        return undefined;
    }
};

module.exports = {

    user: {
        get: function (req, res) {
            getUserCollection().findOne({_id: new ObjectID(req.user._id)}, function(err, user) {
                if (err || !user) {
                    res.json(500, { message: "could not get user"});
                } else {
                    var responseObject = {
                        email: user.email,
                        username: user.username,
                        _id : user._id
                    };
                    res.json(responseObject);
                }
            });
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
                    expiresInMinutes = requestParams.expiresInMinutes;
                    if (!expiresInMinutes) {
                        expiresInMinutes = 60 * 5;
                    }
                    var token = jsonwebtoken.sign(profile, authenticationMiddleware.secret, { expiresInMinutes: expiresInMinutes });
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
                    callback(getErrorForPassword(requestParams.password) ||
                             getErrorForEmail(requestParams.email) ||
                             getErrorForUserName(requestParams.username));
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
                    sendResponseForError(res, err);
            });
        }
    }
};
