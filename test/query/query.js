var async = require('async');
var configureDryRoutes = require('express-dry-router');
var user = require('../../routes/user');
var collectionApi = require('../../lib/collection-api');
var databaseUtils = require('../../lib/database-utils');
var should = require('should');
var requestApi = require('request');
var request;
var server = require('../../server');
var assert = require('assert');
var async = require('async');
var dropDatabase = require('../../lib/drop-database');

var getUnusedPort = require('../port-helper');
var port = getUnusedPort();

var url = 'http://localhost:' + port;
var auth = require('./../helper/auth')(url, requestApi.defaults({followRedirect: false}));


var getCollectionRoute = function (collection, indexes, callback) {
    var route = {};
    route[collection] = collectionApi(collection);
    databaseUtils.addIndexs(collection, indexes, function (err) {
        callback(null, route);
    });
};

var collection = 'items';

var configRoutes = function (app, callback) {
    getCollectionRoute(collection, ['user', 'firstName', 'lastName', 'age', 'british'], function (err, route) {
        configureDryRoutes(route, app, undefined, ['use']);
        configureDryRoutes(user, app, undefined, ['use']);
        configureDryRoutes(route, app);
        configureDryRoutes(user, app);
        callback(err);
    });
};

var objectArray = [
    {
        firstName: "Alex",
        lastName: "Birkett",
        age: 35,
        british: true
    },
    {
        firstName: "Xiaolei",
        lastName: "Liu",
        age: 21,
        british: false
    },
    {
        firstName: "John",
        lastName: "Smith",
        age:45,
        british: true
    },
    {
        firstName: 'Zhong',
        lastName: 'Li',
        age: 35,
        british: false
    }
];



var dbUrl = 'mongodb://localhost/testQuery';

var credential1 = {
    email: 'test@ten20.com',
    password: 'passwordone',
    username: 'testertesterson'
};

var collectionUrl = url + '/' + collection;

describe('test query', function () {

    before(function (done) {
        async.waterfall([function (callback) {
            dropDatabase(dbUrl, callback);
        }, function (callback) {
            server.startServer(port, dbUrl, configRoutes, callback);
        },function (callback) {
            auth.signUp(credential1 , callback);
        },function (response, body, callback) {
            auth.authenticate(credential1, callback);
        }, function(prequest, callback) {
            request = prequest;
            callback();
        }], done);
    });

    after(function (done) {
        async.series([function (callback) {
            auth.signOut(callback);
        }, function (callback) {
            server.close(callback);
        }], done);

    });

    it('should store object in response to POST', function (done) {
        request.put({url: collectionUrl, json: objectArray }, function (error, response, body) {
            assert.equal(200, response.statusCode);
            done();
        });
    });

    var objectAsReturnedFromServer;

    it('should respond to GET with entire collection', function (done) {
        request.get(collectionUrl, function (error, response, body) {
            assert.equal(200, response.statusCode);
            var jsonObject = objectAsReturnedFromServer = JSON.parse(body);
            assert.equal(4, jsonObject.items.length);
            assert.equal('Alex', jsonObject.items[0].firstName);
            assert.equal('Xiaolei', jsonObject.items[1].firstName);
            assert.equal('John', jsonObject.items[2].firstName);
            assert.equal('Zhong', jsonObject.items[3].firstName);
            done();
        });
    });


    it('should respond to GET query for firstname=Ben with no records', function (done) {
        request.get({url: collectionUrl + '?firstName=Ben', json:true}, function (error, response, body) {
            assert.equal(404, response.statusCode);
            assert.equal(0, body.items.length);
            done();
        });
    });

    it('should respond to HEAD query for firstname=Ben with 404', function (done) {
        request.head({url: collectionUrl + '?firstName=Ben', json:true}, function (error, response, body) {
            assert.equal(404, response.statusCode);
            done();
        });
    });


    it('should respond to query for firstname=Alex with Alex\'s record', function (done) {
        request.get(collectionUrl + '?firstName=Alex', function (error, response, body) {
            assert.equal(200, response.statusCode);
            var jsonObject = JSON.parse(body);
            assert.equal(1, jsonObject.items.length);
            done();
        });
    });

    it('should respond to HEAD query for firstname=Alex with 200', function (done) {
        request.head({url: collectionUrl + '?firstName=Alex', json:true}, function (error, response, body) {
            assert.equal(200, response.statusCode);
            done();
        });
    });


    it('should respond to query for age=35 with Alex\'s and Zhong\'s record', function (done) {
        request.get(collectionUrl + '?age=35', function (error, response, body) {
            assert.equal(200, response.statusCode);
            var jsonObject = JSON.parse(body);
            assert.equal(2, jsonObject.items.length);
            assert.equal('Alex', jsonObject.items[0].firstName);
            assert.equal('Zhong', jsonObject.items[1].firstName);
            done();
        });
    });

    it('should respond to query for british=true with Alex\'s and John\'s records', function (done) {
        request.get(collectionUrl + '?british=true', function (error, response, body) {
            assert.equal(200, response.statusCode);
            var jsonObject = JSON.parse(body);
            assert.equal(2, jsonObject.items.length);
            assert.equal('Alex', jsonObject.items[0].firstName);
            assert.equal('John', jsonObject.items[1].firstName);
            done();
        });
    });

    it('should respond to query for british=false with Xiaolei\'s and Zhong\'s records', function (done) {
        request.get(collectionUrl + '?british=false', function (error, response, body) {
            assert.equal(200, response.statusCode);
            var jsonObject = JSON.parse(body);
            assert.equal(2, jsonObject.items.length);
            assert.equal('Xiaolei', jsonObject.items[0].firstName);
            assert.equal('Zhong', jsonObject.items[1].firstName);
            done();
        });
    });

    it('should respond to query for british=true and age=35 with Alex\'s record', function (done) {
        request.get(collectionUrl + '?british=true&age=35', function (error, response, body) {
            assert.equal(200, response.statusCode);
            var jsonObject = JSON.parse(body);
            assert.equal(1, jsonObject.items.length);
            assert.equal('Alex', jsonObject.items[0].firstName);
            done();
        });
    });

    it('should respond to query for ?age=gt$34 with Alex, John, and Zhong\'s record', function (done) {
        request.get(collectionUrl + '?age=gt$34', function (error, response, body) {
            assert.equal(200, response.statusCode);
            var jsonObject = JSON.parse(body);
            assert.equal(3, jsonObject.items.length);
            assert.equal('Alex', jsonObject.items[0].firstName);
            assert.equal('Zhong', jsonObject.items[1].firstName);
            assert.equal('John', jsonObject.items[2].firstName);

            done();
        });
    });


    it('should respond to query for ?age=gte$35 with Alex, John, and Zhong\'s record', function (done) {
        request.get(collectionUrl + '?age=gte$35', function (error, response, body) {
            assert.equal(200, response.statusCode);
            var jsonObject = JSON.parse(body);
            assert.equal(3, jsonObject.items.length);
            assert.equal('Alex', jsonObject.items[0].firstName);
            assert.equal('Zhong', jsonObject.items[1].firstName);
            assert.equal('John', jsonObject.items[2].firstName);

            done();
        });
    });

    it('should respond to query for ?age=lt$35 with Xiaolei\'s record', function (done) {
        request.get(collectionUrl + '?age=lt$35', function (error, response, body) {
            assert.equal(200, response.statusCode);
            var jsonObject = JSON.parse(body);
            assert.equal(1, jsonObject.items.length);
            assert.equal('Xiaolei', jsonObject.items[0].firstName);
            done();
        });
    });


    it('should respond to query for ?age=lte$35 with Alex, Zhong and Xiaolei\'s record', function (done) {
        request.get(collectionUrl + '?age=lte$35', function (error, response, body) {
            assert.equal(200, response.statusCode);
            var jsonObject = JSON.parse(body);
            assert.equal(3, jsonObject.items.length);
            assert.equal('Xiaolei', jsonObject.items[0].firstName);
            assert.equal('Alex', jsonObject.items[1].firstName);
            assert.equal('Zhong', jsonObject.items[2].firstName);
            done();
        });
    });

    it('should respond to query for object id greater than first object id with second, third and fourth objects', function (done) {
        request.get(collectionUrl + '?_id=gt$' + objectAsReturnedFromServer.items[0]._id, function (error, response, body) {
            assert.equal(200, response.statusCode);
            var jsonObject = JSON.parse(body);
            assert.equal(3, jsonObject.items.length);
            assert.equal('Xiaolei', jsonObject.items[0].firstName);
            assert.equal('John', jsonObject.items[1].firstName);
            assert.equal('Zhong', jsonObject.items[2].firstName);

            done();
        });
    });

    it('should respond to query for specific id', function (done) {
        request.get(collectionUrl + '?_id=' + objectAsReturnedFromServer.items[0]._id, function (error, response, body) {
            assert.equal(200, response.statusCode);
            var jsonObject = JSON.parse(body);
            assert.equal(1, jsonObject.items.length);
            assert.equal('Alex', jsonObject.items[0].firstName);
            done();
        });
    });

    it('should delete all items in collection', function (done) {
        request.del(collectionUrl, function (error, response, body) {
            assert.equal(200, response.statusCode);
            request.get({url:collectionUrl, json: true}, function (error, response, body) {
                assert.equal(404, response.statusCode);
                assert.equal(0, body.items.length);
                done();
            });
        });
    });

    it('should store 1000 items in response to POST', function (done) {

        var objectArray = [];

        for (var i = 0; i < 1000; i++) {
            objectArray[i] = { name: 'item' + i , inverseIndex: (999 - i)}
        }

        request.post({url: collectionUrl, json: objectArray }, function (error, response, body) {
            assert.equal(200, response.statusCode);

            request.get({url:collectionUrl, json: true}, function (error, response, body) {
                assert.equal(response.statusCode, 200);
                assert.equal(body.items.length, 1000);

                for (var i = 0; i < 1000; i++) {
                    assert.equal(body.items[i].name, 'item' + i);
                }

                done();
            });

        });
    });

    it('should respect descending sort order', function (done) {
        request.get({url:collectionUrl + '?sortBy=_id$desc', json: true}, function (error, response, body) {
            assert.equal(response.statusCode, 200);
            assert.equal(body.items.length, 1000);

            for (var i = 0; i < 1000; i++) {
                assert.equal(body.items[i].name, 'item' + (999 - i));
            }

            done();
        });
    });

    it('should respect ascending sort order', function (done) {
        request.get({url:collectionUrl + '?sortBy=_id$asc', json: true}, function (error, response, body) {
            assert.equal(response.statusCode, 200);
            assert.equal(body.items.length, 1000);

            for (var i = 0; i < 1000; i++) {
                assert.equal(body.items[i].name, 'item' + i);
            }

            done();
        });
    });

    it('should ignore empty sort order', function (done) {
        request.get({url:collectionUrl + '?sortBy=', json: true}, function (error, response, body) {
            assert.equal(response.statusCode, 200);
            assert.equal(body.items.length, 1000);

            for (var i = 0; i < 1000; i++) {
                assert.equal(body.items[i].name, 'item' + i);
            }

            done();
        });
    });

    it('should ignore empty order direction', function (done) {
        request.get({url:collectionUrl + '?sortBy=inverseIndex', json: true}, function (error, response, body) {
            assert.equal(response.statusCode, 200);
            assert.equal(body.items.length, 1000);

            for (var i = 0; i < 1000; i++) {
                assert.equal(body.items[i].name, 'item' + i);
            }
            done();
        });
    });


    var lastId;
    it('should respect limit parameter', function (done) {
        request.get({url:collectionUrl + '?limit=100', json: true}, function (error, response, body) {
            assert.equal(response.statusCode, 200);
            assert.equal(body.items.length, 100);

            for (var i = 0; i < 100; i++) {
                assert.equal(body.items[i].name, 'item' + i);
            }

            lastId = body.items[99]._id;
            done();
        });
    });

    var firstId;
    it('should respect after parameter', function (done) {
        request.get({url:collectionUrl + '?limit=100&_id=after$' + lastId, json: true}, function (error, response, body) {
            assert.equal(response.statusCode, 200);
            assert.equal(body.items.length, 100);

            for (var i = 0; i < 100; i++) {
                assert.equal(body.items[i].name, 'item' + (i + 100));
            }

            firstId = body.items[0]._id;
            done();
        });
    });

    it('should respect before parameter - we need sort to test this properly', function (done) {
        request.get({url:collectionUrl + '?limit=10&_id=before$' + firstId, json: true}, function (error, response, body) {
            assert.equal(response.statusCode, 200);
            assert.equal(body.items.length, 10);

            for (var i = 0; i < 10; i++) {
                assert.equal(body.items[i].name, 'item' + i);
            }

            done();
        });
    });

    it('should delete all items in collection again', function (done) {
        request.del(collectionUrl, function (error, response, body) {
            assert.equal(200, response.statusCode);
            request.get({url:collectionUrl, json: true}, function (error, response, body) {
                assert.equal(404, response.statusCode);
                assert.equal(0, body.items.length);
                done();
            });
        });
    });


    it('should store items with dates in response to POST', function (done) {
        var items = [
            {
                timestamp: new Date('2001-09-09T01:46:40Z')
            },
            {
                timestamp: new Date('2001-09-09T01:46:41Z')
            },
            {
                timestamp: new Date('2001-09-09T01:46:42Z')
            }
        ];

        request.post({url: collectionUrl, json: items }, function (error, response, body) {
            assert.equal(200, response.statusCode);
            done();


        });
    });

    it('should possible to find three items', function (done) {
        request.get({url: collectionUrl, json: true}, function (error, response, body) {
            assert.equal(response.statusCode, 200);
            assert.equal(body.items.length, 3);
            done();
        });
    });


    it('should possible to find one item added before 2001-09-09T01:46:41Z', function (done) {
        request.get({url: collectionUrl + '?timestamp=before$date:2001-09-09T01:46:41Z', json: true}, function (error, response, body) {
            assert.equal(response.statusCode, 200);
            assert.equal(body.items.length, 1);
            done();
        });
    });

    it('should possible to find one item added before timestamp 1,000,000,001,000', function (done) {
        request.get({url: collectionUrl + '?timestamp=before$timestamp:1000000001000', json: true}, function (error, response, body) {
            assert.equal(response.statusCode, 200);
            assert.equal(body.items.length, 1);
            done();
        });
    });

    it('should possible to find two items added after timestamp 1,000,000,000,000', function (done) {
        request.get({url: collectionUrl + '?timestamp=after$timestamp:1000000000000', json: true}, function (error, response, body) {
            assert.equal(response.statusCode, 200);
            assert.equal(body.items.length, 2);
            done();
        });
    });
});
