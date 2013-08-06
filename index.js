var routes = require('./routes'),
    user = require('./routes/user');

module.exports = function(app) {
    app.get('/api', routes.index);
    app.get('/users', user.list);
};