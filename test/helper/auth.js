
module.exports = function (url, request) {
    return {
        signUp: function (credential, callback) {
            request.post({url: url + '/signup', json: credential}, function (error, response, body) {
                callback(error, response, body);
            });
        },
        signIn: function (credential, callback) {
            request.post({url: url + '/signin', json: credential}, function (error, response, body) {
                callback(error, response, body);
            });
        },
        signOut: function(callback) {
            request.get(url + '/signout', function (error, response, body) {
                callback(error, response, body);
            });
        }
    }
};
