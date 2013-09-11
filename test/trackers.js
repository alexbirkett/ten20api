var should = require('should');
var request = require('superagent');

var trackerData = [{
  "id": "1234567",
    "name": "Alex",
    "iconEmail": "alex@birkett.no",
    "iconColor": "FF00FF",
    "serialNumber": "14234234234", // device serial number
    "lastUpdateTimestamp": (new Date()).valueOf(),
    "fence": "on 5km", // on *km, off
    "latitude": 52.80113,
    "longitude": -1.63130,
    "speed": "20", // km/h
    "course": "359", // degrees
    "gpsAvailable": true
}, {
  "id": "1234568", // id in database
    "name": "Alex",
    "iconEmail": "alex@birkett.no",
    "iconColor": "FF00FF",
    "serialNumber": "24234234235", // device serial number
    "lastUpdateTimestamp": (new Date()).valueOf(),
    "fence": "off", // on *km, off
    "latitude": 52.80323,
    "longitude": -1.61930,
    "speed": "10", // km/h
    "course": "13", // degrees
    "gpsAvailable": true
}];

describe('trackers api', function() {
  var url = 'http://localhost:3000';

  before(function(done) {
    // wait for server start up
    setTimeout(done, 2000);
  });

  describe('routes: --> /trackers/', function() {
    var credential = {
      email: 'test@ten20.com',
      password: 'test'
    };

    it('setup: create an test account', function(done){
      request.post(url + '/signup')
      .send(credential)
      .set('Content-Type', 'application/json')
      .end(function(res) {
        res.should.have.status(200);
        res.body.should.have.property('message');
        res.body.message.should.not.equal('server interal error!');
        done();
      });
    });

    it('should get zero trackers --> GET', function(done){
      request.get(url + '/trackers')
      .query({email: credential.email})
      .end(function(res) {
        res.should.have.status(200);
        res.body.should.be.empty;
        done();
      });
    });

    it('should put trackers success --> PUT', function(done){
      request.put(url + '/trackers')
      .send({email: credential.email})
      .send({trackers: [trackerData[0]]})
      .end(function(res) {
        res.should.have.status(200);
        res.body.should.have.property('message');
        res.body.message.should.equal('');
        done();
      });
    });

    it('should get one tracker --> GET', function(done){
      request.get(url + '/trackers')
      .query({email: credential.email})
      .end(function(res) {
        res.should.have.status(200);
        res.body.length.should.equal(1);
        done();
      });
    });


    it('should add tracker success --> POST', function(done){
      request.post(url + '/trackers')
      .send({email: credential.email})
      .send({tracker: trackerData[1]})
      .end(function(res) {
        res.should.have.status(200);
        res.body.should.have.property('message');
        res.body.message.should.equal('');
        done();
      });
    });

    it('should get two trackers --> GET', function(done){
      request.get(url + '/trackers')
      .query({email: credential.email})
      .end(function(res) {
        res.should.have.status(200);
        res.body.length.should.equal(2);
        done();
      });
    });

    it('should delete user trackers success --> DELETE', function(done){
      request.del(url + '/trackers')
      .send({email: credential.email})
      .end(function(res) {
        res.should.have.status(200);
        res.body.should.have.property('message');
        res.body.message.should.equal('');
        done();
      });
    });

  });

  describe('routes: --> /trackers/:id', function() {
    var trackerUrl = url + '/trackers/1234567';

    it('should put tracker success --> PUT', function(done){
      request.put(trackerUrl)
      .send({tracker: trackerData[0]})
      .end(function(res) {
        res.should.have.status(200);
        res.body.should.have.property('message');
        res.body.message.should.equal('');
        done();
      });
    });

    it('should get tracker success --> GET', function(done){
      request.get(trackerUrl)
      .end(function(res) {
        res.should.have.status(200);
        res.body.tracker.id.should.equal('1234567');
        done();
      });
    });

    it('should delete tracker success --> DELETE', function(done){
      request.del(trackerUrl)
      .end(function(res) {
        res.should.have.status(200);
        res.body.should.have.property('message');
        res.body.message.should.equal('');
        done();
      });
    });

    it('should get tracker fail --> GET', function(done){
      request.get(trackerUrl)
      .end(function(res) {
        res.should.have.status(200);
        should.not.exist(res.body.tracker);
        done();
      });
    });

  });
});
