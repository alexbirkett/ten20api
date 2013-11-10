module.exports = function(collection, port) {

    var should = require('should');
    var requestApi = require('request');
    var request = requestApi.defaults({followRedirect: false, jar: requestApi.jar()});
    var server = require('../../server');
    var assert = require('assert');
    var async = require('async');
    var dropDatabase = require('../../lib/drop-database');
    var url = 'http://localhost:' + port;
    var configRoutes = require('../../lib/route-config');
    var auth = require('./auth')(url, request);

    var objectArray = [
        {
            "name": "Xiaolei"
        },
        {
            "name": "Alex"
        },
        {

        }
    ];

    var dbUrl = 'mongodb://localhost/test' + collection;

    var credential1 = {
        email: 'test@ten20.com',
        password: 'passwordone'
    };

    var credential2 = {
        email: 'test2@ten20.com',
        password: 'passwordtwo'
    };

    var collectionUrl = url + '/' + collection;

    describe(collection + ' api', function () {


        before(function (done) {
            async.series([function (callback) {
                dropDatabase(dbUrl, callback);
            }, function (callback) {
                server.startServer(port, dbUrl, configRoutes, callback);
            }], done);
        });

        after(function (done) {
            server.close(done);
        });

        it('should respond to GET with unauthorized before login', function (done) {
            request.get(collectionUrl, function (error, response, body) {
                assert.equal(401, response.statusCode);
                done();
            });
        });

        it('should respond to PUT with unauthorized before login', function (done) {
            request.put(collectionUrl, function (error, response, body) {
                assert.equal(401, response.statusCode);
                done();
            });
        });

        it('should respond to POST with unauthorized before login', function (done) {
            request.post(collectionUrl, function (error, response, body) {
                assert.equal(401, response.statusCode);
                done();
            });
        });

        it('should respond to DELETE with unauthorized before login', function (done) {
            request.del(collectionUrl, function (error, response, body) {
                assert.equal(401, response.statusCode);
                done();
            });
        });

        it('setup: create a test account', function (done) {
            auth.signUp(credential1, done);
        });

        it('setup: signin with credential1', function (done) {
            auth.signIn(credential1, done);
        });

        var credential1Info;
        it('setup: get user info for later', function (done) {
            auth.getUserInfo(function(error, response, info){
                credential1Info = info;
                done();
            });
        });

        it('should respond to GET with empty array', function (done) {
            request.get(collectionUrl, function (error, response, body) {
                assert.equal(200, response.statusCode);
                var jsonBody = JSON.parse(body);
                assert.equal(0, jsonBody.items.length);
                done();
            });
        });

        it('should store object in response to POST', function (done) {
            request.post({url: collectionUrl, json: objectArray[0] }, function (error, response, body) {
                assert.equal(200, response.statusCode);
                done();
            });
        });

        var previouslyStoreObjectId;

        it('should respond to GET with previously posted object', function (done) {
            request.get(collectionUrl, function (error, response, body) {
                assert.equal(200, response.statusCode);

                var jsonBody = JSON.parse(body);

                jsonBody.items.should.have.lengthOf(1);
                var object = jsonBody.items[0];
                object.should.have.property('name', 'Xiaolei');
                previouslyStoreObjectId = object._id;
                done();
            });
        });

        it('should respond to GET for specific object id', function (done) {
            var url = collectionUrl + '/' + previouslyStoreObjectId;
            request.get({url: url}, function (error, response, body) {
                assert.equal(200, response.statusCode);

                var jsonBody = JSON.parse(body);

                jsonBody.should.have.property('name', 'Xiaolei');


                done();
            });
        });

        it('should replace collection of objects in response to PUT', function (done) {
            request.put({url: collectionUrl, json: objectArray }, function (error, response, body) {
                assert.equal(200, response.statusCode);
                done();
            });
        });

        it('should respond to GET with previously PUT collection of objects', function (done) {
            request.get(collectionUrl, function (error, response, body) {
                assert.equal(200, response.statusCode);

                var jsonBody = JSON.parse(body);
                jsonBody.items.should.have.lengthOf(3);
                var items = jsonBody.items;
                assert.equal(undefined, items[2].name);
                assert.equal('Alex', items[1].name);
                assert.equal('Xiaolei', items[0].name);
                done();
            });
        });

        it('should respond to GET for specific object id with 404', function (done) {
            request.get({url: collectionUrl + '/526fb0b3970998723e000004' }, function (error, response, body) {
                assert.equal(404, response.statusCode);
                done();
            });
        });

        it('should store specific object ID in response to PUT', function (done) {
            request.put({url: collectionUrl + '/526fb0b3970998723e000004', json: objectArray[0] }, function (error, response, body) {
                assert.equal(200, response.statusCode);
                done();
            });
        });


        it('should respond to GET for specific object id with correct document', function (done) {
            request.get({url: collectionUrl + '/526fb0b3970998723e000004' }, function (error, response, body) {
                assert.equal(200, response.statusCode);
                assert.equal('Xiaolei', JSON.parse(body).name);
                done();
            });
        });

        it('should replace specific document in response to PUT', function (done) {
            request.put({url: collectionUrl + '/526fb0b3970998723e000004', json: objectArray[1] }, function (error, response, body) {
                assert.equal(200, response.statusCode);
                done();
            });
        });

        it('should respond to GET for specific object id with correct document with previously updated content', function (done) {
            request.get({url: collectionUrl + '/526fb0b3970998723e000004' }, function (error, response, body) {
                assert.equal(200, response.statusCode);
                assert.equal('Alex', JSON.parse(body).name);
                done();
            });
        });

        it('setup logout', function (done) {
            auth.signOut(done);
        });

        it('should respond to GET with unauthorized after logout', function (done) {
            request.get(collectionUrl, function (error, response, body) {
                assert.equal(401, response.statusCode);
                done();
            });
        });

        it('should respond to PUT with unauthorized after logout', function (done) {
            request.put(collectionUrl, function (error, response, body) {
                assert.equal(401, response.statusCode);
                done();
            });
        });

        it('should respond to POST with unauthorized after logout', function (done) {
            request.post(collectionUrl, function (error, response, body) {
                assert.equal(401, response.statusCode);
                done();
            });
        });

        it('should respond to DELETE with unauthorized after logout', function (done) {
            request.del(collectionUrl, function (error, response, body) {
                assert.equal(401, response.statusCode);
                done();
            });
        });

        it('should respond to GET requesting specific object with unauthorized', function (done) {
            request.get({url: collectionUrl + '/526fb0b3970998723e000004' }, function (error, response, body) {
                assert.equal(401, response.statusCode);
                done();
            });
        });

        it('should respond to DELETE specific object with unauthorized', function (done) {
            request.del({url: collectionUrl + '/526fb0b3970998723e000004'}, function (error, response, body) {
                assert.equal(401, response.statusCode);
                done();
            });
        });

        it('setup: create second test account', function (done) {
            auth.signUp(credential2, done);
        });

        it('setup: signin with credential2', function (done) {
            auth.signIn(credential2, done);
        });

        it('should respond to GET with zero objects (after switching accounts)', function (done) {
            request.get(collectionUrl, function (error, response, body) {
                assert.equal(200, response.statusCode);
                var jsonBody = JSON.parse(body);
                jsonBody.items.should.have.lengthOf(0);
                done();
            });
        });

        //credential1Info

        it('should not be possible to get trackers owned by other user', function (done) {
            request.get(collectionUrl + '?user=' + credential1Info._id, function (error, response, body) {
                assert.equal(200, response.statusCode);
                var jsonBody = JSON.parse(body);
                jsonBody.items.should.have.lengthOf(0);
                done();
            });
        });

        it('should respond to GET requesting object created by other account with unauthorized', function (done) {
            request.get({url: collectionUrl + '/526fb0b3970998723e000004' }, function (error, response, body) {
                assert.equal(401, response.statusCode);
                done();
            });
        });

        it('should respond to PUT updating object created by other account with unauthorized', function (done) {
            request.put({url: collectionUrl + '/526fb0b3970998723e000004', json: objectArray[1] }, function (error, response, body) {
                assert.equal(401, response.statusCode);
                done();
            });
        });

        it('should respond to DELETE object created by other account with unauthorized', function (done) {
            request.del({url: collectionUrl + '/526fb0b3970998723e000004'}, function (error, response, body) {
                assert.equal(401, response.statusCode);
                done();
            });
        });

        it('POST should add object', function (done) {
            request.post({url: collectionUrl, json: objectArray[1] }, function (error, response, body) {
                assert.equal(200, response.statusCode);
                done();
            });
        });

        it('setup logout', function (done) {
            auth.signOut(done);
        });

        it('setup: signin with credential1', function (done) {
            auth.signIn(credential1, done);
        });

        it('should respond to GET for specific object id with correct document (survive delete attempts when logged out or by other account)', function (done) {
            request.get({url: collectionUrl + '/526fb0b3970998723e000004' }, function (error, response, body) {
                assert.equal(200, response.statusCode);
                assert.equal(objectArray[1].name, JSON.parse(body).name);
                done();
            });
        });

        it('should respond to GET with 4 objects', function (done) {
            request.get(collectionUrl, function (error, response, body) {
                assert.equal(200, response.statusCode);
                var jsonBody = JSON.parse(body);
                assert.equal(4, jsonBody.items.length);
                done();
            });
        });

        it('should respond to DELETE object by removing object from database', function (done) {
            request.del({url: collectionUrl + '/526fb0b3970998723e000004'}, function (error, response, body) {
                assert.equal(200, response.statusCode);
                done();
            });
        });

        it('should respond to GET for specific object id with not found', function (done) {
            request.get({url: collectionUrl + '/526fb0b3970998723e000004' }, function (error, response, body) {
                assert.equal(404, response.statusCode);
                done();
            });
        });

        it('should respond to GET with 3 objects', function (done) {
            request.get(collectionUrl, function (error, response, body) {
                assert.equal(200, response.statusCode);
                var jsonBody = JSON.parse(body);
                assert.equal(3, jsonBody.items.length);
                done();
            });
        });

        it('should respond to DELETE object removing entire object collection', function (done) {
            request.del({url: collectionUrl }, function (error, response, body) {
                assert.equal(200, response.statusCode);
                done();
            });
        });

        it('should respond to GET with 0 objects', function (done) {
            request.get(collectionUrl, function (error, response, body) {
                assert.equal(200, response.statusCode);
                var jsonBody = JSON.parse(body);
                assert.equal(0, jsonBody.items.length);
                done();
            });
        });
    });
}
