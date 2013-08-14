var routes = require('./routes');
var tracker = require('./routes/tracker');
var addRoutes = require('./router');

module.exports = function(app) {
    app.post('/api/tracker/message', routes.index);
    addRoutes(tracker, app);
};