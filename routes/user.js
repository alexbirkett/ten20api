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

var addIndicesToUser = function (callback) {
    var collection = getUserCollection();
    async.series([
        function (callback) {
            collection.ensureIndex({ "email": 1 }, { unique: true }, callback);
        },
        function (callback) {
            collection.ensureIndex({ "username": 1 }, { unique: true }, callback);
        }], function (err) {
        callback(err);
    });
};

var NO_PASSWORD_SPECIFIED = 'no password specified';
var NO_USERNAME_SPECIFIED = 'no username specified';
var USER_ALREADY_EXISTS = 'user already exists';
var PASSWORD_TOO_SHORT = 'password too short';
var INVALID_EMAIL_ADDRESS = 'invalid email address';
var INVALID_USERNAME = 'invalid user name';

var isDuplicateKeyError = function(err) {
    return err.name && err.name == 'MongoError' && err.err && err.err.indexOf('duplicate key') > -1;
};

var sendResponseForError = function(res, err) {
    if (!err) {
        res.json({ message: 'account created'});
    } else if (err === USER_ALREADY_EXISTS || isDuplicateKeyError(err) ) {
        res.json(403, { message: 'user already exists'});
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

var isValidPassword = function(password) {
    return (password.length >= 8);
};

var isValidUserName = function(username) {
    return username.indexOf('@') === -1;
};

var getErrorForPassword = function(password) {
    if (!password) {
        return NO_PASSWORD_SPECIFIED;
    } else if (isValidPassword(password)) {
        return undefined;
    } else {
        return PASSWORD_TOO_SHORT;
    }
};

var getErrorForPasswordIfExists = function(password) {
    if (password == null || password === undefined) {
        return undefined;
    } else {
        if (isValidPassword(password)) {
            return undefined;
        } else {
            return PASSWORD_TOO_SHORT;
        }
    }
};

var getErrorForUserName = function(username) {
    if (!username || username.length < 1) {
        return NO_USERNAME_SPECIFIED;
    } else if (!isValidUserName(username)) {
        return INVALID_USERNAME;
    } else {
        return undefined;
    }
};

var getErrorForUserNameIfExists = function(username) {
    if (username == null || username === undefined) {
        return undefined;
    } else {
        if (username.length < 1) {
            return NO_USERNAME_SPECIFIED;
        } else if (!isValidUserName(username)) {
            return INVALID_USERNAME;
        } else {
            return undefined;
        }
    }
};

var getErrorForEmailIfExists = function(email) {
    if (email !== null && email !== undefined && (email.indexOf('@') < 0 || email.length < 3)) {
        return INVALID_EMAIL_ADDRESS;
    } else {
        return undefined;
    }
};

var routes = {

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
        patch: function(req, res) {



            var requestParams = req.body;
            async.waterfall([
                function (callback) {
                        callback(getErrorForUserNameIfExists(requestParams.username) ||
                                 getErrorForPasswordIfExists(requestParams.password) ||
                                 getErrorForEmailIfExists(requestParams.email));
                },
                function (callback) {
                    if (requestParams.password) {
                        scrypt.passwordHash(requestParams.password, MAX_TIME, callback);
                    } else {
                        callback(null, null);
                    }
                },
                function (pwdhash, callback) {
                    var userObject = { };

                    if (requestParams.email) {
                        userObject.email = requestParams.email;
                    }

                    if (requestParams.username) {
                        userObject.username = requestParams.username;
                    }
                    if (pwdhash != null) {
                        userObject.hash = pwdhash;
                    }

                    getUserCollection().update({_id: new ObjectID(req.user._id)}, { $set: userObject }, { upsert : true}, callback);
                }],
                function (err) {
                    sendResponseForError(res, err);
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
                             getErrorForEmailIfExists(requestParams.email) ||
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

module.exports = function(callback) {
    addIndicesToUser(function(err) {
            callback(err, routes);
    });
};
