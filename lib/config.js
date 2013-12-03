

var longPollTimeout = 60 * 60 * 1000;
var cleanupInterval = 60 * 1000;

module.exports = {
  setLongPollTimeOut: function(timeout) {
    longPollTimeout = timeout;
  },
  getLongPollTimeOut: function() {
      return longPollTimeout;
  },
  setLongPollCleanupInterval: function(interval) {
      cleanupInterval = interval;
  },
  getLongPollCleanupInterval: function()  {
      return cleanupInterval;
  }
};