var addRoutes = function(routeObject, app, path) {

    var httpVerbs = ['get', 'post', 'put', 'delete'];

    path = path || '';

    for(var property in routeObject){
        var routesAdded = false;
        for (var verbIndex in httpVerbs) {
            var verb = httpVerbs[verbIndex];
            var completePath, handler;
            if (property === verb) {
                if (typeof(routeObject[verb]) === 'function') {
                    handler = routeObject[verb];
                    completePath = path;
                } else {
                    handler = routeObject[verb].handler;
                    completePath = path + (routeObject[verb].params || '');
                }
                app[verb](completePath, handler);
                routesAdded = true;
            }
        }
        if (!routesAdded) {
            addRoutes(routeObject[property], app, path + '/' + property);
        }
    }
    return app;
};

module.exports = addRoutes;
