
var requestApi = require('request');


module.exports = function (url, request) {
    return {
        signUp: function (credential, callback) {
            request.post({url: url + '/signup', json: credential}, function (error, response, body) {
                if (response.statusCode !== 200) {
                    error = 'non 200 status code';
                }
                callback(error, response, body);
            });
        },
        signIn: function (credential, callback) {
            request.post({url: url + '/signin', json: credential}, function (error, response, body) {
                if (response.statusCode !== 200) {
                    error = 'non 200 status code';
                }
                callback(error, response, body);
            });
        },
        signOut: function(callback) {
            request.get(url + '/signout', function (error, response, body) {
                callback(error, response, body);
            });
        },
        authenticate: function(credential, callback) {
            request.post({url: url + '/authenticate', json: credential}, function (error, response, body) {
                if (!error && response.statusCode == 200 && body.token) {
                    var request = requestApi.defaults({followRedirect: false, headers: {
                        'Authorization': 'Bearer ' + body.token
                    }});
                    callback(undefined, request);
                } else {
                    callback(error);
                }
            });
        },
        getUserInfo: function(callback) {
            request.get(url + '/user/info', function (error, response, body) {
                callback(error, response, JSON.parse(body));
            });
        }
    }
};
