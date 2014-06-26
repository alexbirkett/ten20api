
var requestApi = require('request');


module.exports = function (url, request) {
    return {
        signUp: function (credential, callback) {
            request.post({url: url + '/signup', json: credential}, function (error, response, body) {
                if (response.statusCode !== 200) {
                    error = 'non 200 status code: ' + response.statusCode;
                }
                callback(error, response, body);
            });
        },
        signIn: function (credential, callback) {
            request.post({url: url + '/signin', json: credential}, function (error, response, body) {
                if (response.statusCode !== 200) {
                    error = 'non 200 status code: ' + response.statusCode;
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
                if (response.statusCode == 200) {
                    if (!error && body.token) {
                        var request = requestApi.defaults({followRedirect: false, headers: {
                            'Authorization': 'Bearer ' + body.token
                        }});
                        callback(undefined, request);
                    } else {
                        callback(error);
                    }
                } else {
                    callback('non 200 status code - ' + response.statusCode);
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
