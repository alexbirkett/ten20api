var passport = require('passport'),
    LocalStrategy = require('passport-local').Strategy,
    scrypt = require("scrypt");

var db = require('./db.js');
var ObjectID = require('mongodb').ObjectID;

var getUserCollection = function() {
    return db.getDb().collection('user');
};

module.exports = function (app) {
    app.use(passport.initialize());
    app.use(passport.session());


    // Passport session setup.
    //   To support persistent login sessions, Passport needs to be able to
    //   serialize users into and deserialize users out of the session.  Typically,
    //   this will be as simple as storing the user ID when serializing, and finding
    //   the user by ID when deserializing.
    //
    passport.serializeUser(function (user, done) {
        done(null, user._id);
    });

    passport.deserializeUser(function (id, done) {
        getUserCollection().findOne({_id: new ObjectID(id) }, function (err, user) {
            done(err, user);
        });
    });

    passport.use(new LocalStrategy({
            usernameField: 'email',
            passwordField: 'password'
        },
        function (mail, password, done) {
            getUserCollection().findOne({ email: mail}, function (err, user) {
                if (err) {
                    return done(err);
                }
                if (!user) {
                    return done(null, false, { message: 'Unknown user ' + mail});
                }
                scrypt.verifyHash(user.hash, password, function (err, isMatch) {
                    if (isMatch) {
                        return done(null, user);
                    } else {
                        return done(null, false, { message: 'Invalid password' });
                    }
                });
            });
        }));

};
