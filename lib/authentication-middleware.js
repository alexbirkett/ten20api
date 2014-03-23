var expressJwt = require('express-jwt');

var secret = "dfasdsdfsdf this is s asdfsadfas asdfasdfasdf eljnoihoisdjdj";

module.exports.secret = secret;

module.exports.middlewareFunction = expressJwt({secret: secret});