var routes = require('./routes');

module.exports = function(app) {
    app.get('/api', routes.index);
};