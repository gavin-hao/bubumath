// var login=require('connect-ensure-login');

function ensureLoggedIn(options) {
    if (typeof options == 'string') {
        options = { redirectTo: options }
    }
    options = options || {};

    var url = options.redirectTo || '/login';
    return function (req, res, next) {
        if (req.isAuthenticated()) {
            return next();
        }
        if (req.xhr) {
            var err = new Error('UnAuthorized');
            err.status = 401;
            return next(err);
        }

        var redirect = req.method.toUpperCase() == 'GET' ? (req.originalUrl || req.url) : '';
        res.redirect(url + '?returnTo=' + redirect)
    }
}

function ensureLoggedOut(options) {
    if (typeof options == 'string') {
        options = { redirectTo: options }
    }
    options = options || {};

    var url = options.redirectTo || '/';

    return function (req, res, next) {
        if (req.isAuthenticated && req.isAuthenticated()) {
            return res.redirect(url);
        }
        next();
    }
}
function authorize(options) {
    if (typeof options == 'string') {
        options = { roles: options }
    }
    options = options || { roles: '' };
    if (typeof options.roles == 'string' && options.roles.lenght > 0) {

        var isInRole=function (role) {
            var roles = options.roles.split(',');
            roles.forEach(function (r) {
                if (r == role)
                    return true;
            });
        }

        return function (req, res, next) {

            if (req.isAuthenticated() && req.user.roles) {
                var currentRoles = [];
                if (typeof req.user.roles == 'string') {
                    currentRoles = req.user.roles.split(',');
                }
                if (req.user.roles instanceof Array) {
                    currentRoles = req.user.roles;
                }
                var access = false;
                for (var i = 0; i < currentRoles.length; i++) {
                    if (isInRole(currentRoles[i])) {
                        access = true;
                        return;
                    }
                }
                if (access) {
                    return next();

                }
            }
            if (req.xhr) {
                var err = new Error('UnAuthorized');
                err.status = 403;
                return next(err);
            }

            var redirect = req.method.toUpperCase() == 'GET' ? req.originalUrl : '';
            res.redirect('/login?redirect=' + redirect)
        }
    } else {
        return ensureLoggedIn(options);
    }

}

module.exports = {
    ensureLoggedIn: ensureLoggedIn,
    ensureLoggedOut: ensureLoggedOut,
    authorize: authorize
}