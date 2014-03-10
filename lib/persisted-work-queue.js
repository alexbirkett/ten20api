
var db = require('./db');
var async = require('async');
var util = require('./util');

var TWENTY_FOUR_HOURS = 24 * 60 * 60 * 1000;

var PersistedWorkQueue = function() {
};

PersistedWorkQueue.prototype.addJob = function(job, callback) {
    var work = {};
    work.addedTimestamp = new Date(util.currentTimeMillis());
    work.job = job;

    this._getCollection().insert(work, function(err) {
        callback(err);
    });
};

PersistedWorkQueue.prototype.setWorkFunction = function(workFunction) {
    this.workFunction = workFunction;
    return this;
};

PersistedWorkQueue.prototype.setCollectionName = function(collectionName) {
    this.collectionName = collectionName;
    return this;
};

PersistedWorkQueue.prototype.tickle = function(callback) {
    if (this.running) {
        process.nextTick(function() {
            callback('already running - non fatal');
        })
    } else {
        var self = this;
        var workDone = function(err) {
            if (err) {
                callback();
            } else {
                // keep working until all the work is done
                startWork();
            }
        };

        var startWork = function() {
            self._startWork(workDone);
        };
        startWork();
    }
};

PersistedWorkQueue.prototype._startWork = function(callback) {
    var self = this;
    var doc;
    async.waterfall([function(callback) {
        self._findWorkAndSetStarted(callback);
    }, function(pdoc, callback) {
       doc = pdoc;
       self.workFunction(doc, callback);
    }, function(callback) {
        self._setWorkComplete(doc, callback);
    }, function(doc, callback) {
        self._cleanupOldWork(callback);
    }], function(err) {
       self.running = false;
       callback(err);
    });
    this.running = true;

};

PersistedWorkQueue.prototype._getCollection = function() {
   return db.getDb().collection(this.collectionName);
};

PersistedWorkQueue.prototype._findWorkAndSetStarted = function(callback) {
    var data = {
        $set: {
            startedTimestamp: new Date(util.currentTimeMillis())
        }
    };

    this._getCollection().findAndModify(  { startedTimestamp: { $exists: false } }, null, data, { new:true }, function(err, doc) {
        // if the query does not find any documents, findAndModify can call back with no error and a null document
        if (!doc) {
            err = 'not found';
        }
        callback(err, doc);
    });
};

PersistedWorkQueue.prototype._setWorkComplete = function(doc, callback) {
    var data = {
        $set: {
            completedTimestamp: new Date(util.currentTimeMillis())
        }
    };

    this._getCollection().findAndModify(  { _id: doc._id }, null, data, { new:true }, function(err, doc) {
        // if the query does not find any documents, findAndModify can call back with no error and a null document
        if (!doc) {
            err = 'not found';
        }
        callback(err, doc);
    });
};

PersistedWorkQueue.prototype._cleanupOldWork = function(callback) {
    var query = {
        completedTimestamp: {
            $lte:  new Date(util.currentTimeMillis() - TWENTY_FOUR_HOURS)
        }
    };

    this._getCollection().remove(query, function(err) {
        callback(err)
    });

};

module.exports = PersistedWorkQueue;