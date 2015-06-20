"use strict";

var _routes = {get: {}};

var router = {
	get: function(route, fn) {
		_routes.get[route] = fn;
		return this;
	}
	dispatch: function(req, res) {
		return this;
	};
};

function _routeParser(route) {
}

module.exports = router;
