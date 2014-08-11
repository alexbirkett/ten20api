var expressJwt = require('express-jwt');

var secret = require('./secret');

var middlewareFunction;

module.exports.getMiddleware = function() {

    if (!middlewareFunction) {
        middlewareFunction = expressJwt({secret: secret.getSecret()});
    }
    return middlewareFunction;
}


