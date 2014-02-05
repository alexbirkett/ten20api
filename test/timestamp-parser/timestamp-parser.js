/**
 * Created by alex on 05/02/14.
 */
var parseTimeStamps = require('../../lib/timestamp-parser');
var assert = require('assert');


var convertToJsonAndBack = function(object) {
    return JSON.parse(JSON.stringify(object));
}

describe('test timestamp parsing function', function () {


    it('should convert keys called timestamp into dates when they contain strings', function (done) {

        var date = new Date('2001-09-09T01:46:40Z');

        var input = convertToJsonAndBack(
            {
                timestamp: date
            });

        var output = parseTimeStamps(input);

        assert.equal(output.timestamp.getTime(), date.getTime());
        done();
    });

    it('should convert keys called timestamp into dates when they contain numbers', function (done) {

        var timestamp =  1000000000;

        var input = convertToJsonAndBack(
            {
                timestamp: timestamp
            });

        var output = parseTimeStamps(input);

        assert.equal(output.timestamp.getTime(), timestamp);
        done();
    });

    it('should convert keys called timestamp into dates', function (done) {

        var timestamp =  1000000000;

        var input = convertToJsonAndBack(
            {
                timestamp: timestamp
            });

        var output = parseTimeStamps(input);

        assert.equal(output.timestamp.getTime(), timestamp);
        done();
    });

    it('should convert keys called startTime into dates', function (done) {

        var timestamp =  1000000000;

        var input = convertToJsonAndBack(
            {
                startTime: timestamp
            });

        var output = parseTimeStamps(input);

        assert.equal(output.startTime.getTime(), timestamp);
        done();
    });

    it('should convert keys called endTime into dates', function (done) {

        var timestamp =  1000000000;

        var input = convertToJsonAndBack(
            {
                endTime: timestamp
            });

        var output = parseTimeStamps(input);

        assert.equal(output.endTime.getTime(), timestamp);
        done();
    });

    it('should work with nested objects', function (done) {

        var timestamp =  1000000000;

        var input = convertToJsonAndBack(
            {
                key: {
                    key: {
                        endTime: timestamp
                    }
                }
            });

        var output = parseTimeStamps(input);

        assert.equal(output.key.key.endTime.getTime(), timestamp);
        done();
    });

    it('should work with arrays', function (done) {

        var timestamp =  1000000000;

        var input = convertToJsonAndBack(
            [{
                endTime: timestamp
            }]);

        var output = parseTimeStamps(input);

        assert.equal(output[0].endTime.getTime(), timestamp);
        done();
    });
});