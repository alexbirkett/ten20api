var routes = require('./routes'),
    user = require('./routes/user');

module.exports = function(app) {
    app.get('/', routes.index);
    app.get('/users', user.list);
};