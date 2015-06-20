"use strict";

var _routes = {get: {absolute: {}, relative: {}}};

var router = {
	get: function(route, fn) {
		if (route.indexOf(":") == -1) { // if the route has no ":variables"
			_routes.get.absolute[route] = fn;
			return this;
		}
		var prev = _routes.get.relative;
		var end = {}; // should start at null?
		var lastPath = function() {}; // default 404 handler?
		route.split("/").reduce(function(__routes, pathSegment) {
			if (!pathSegment) { // skip blank path segments
				return __routes;
			}
			__routes[pathSegment] = {};
			prev = __routes[pathSegment];
			end = __routes;
			lastPath = pathSegment;
			return prev;
		}, prev);
		// set the last pathSegment match equal to the function
		end[lastPath] = fn;

		return this;
	}
/*
	dispatch: function(req, res) {
		var method = req.method.toLowerCase();
		if (!method in _routes) {
			return 404;
		}
		var absoluteMatch = routes[method].absolute[req.url];
		if (absoluteMatch) {
			return absoluteMatch(req, res, parse params);
		}
		then split into path segments
		then match segment by segment in relative matches
		else 404
	};
*/
};

function _routeParser(route) {
}

module.exports = router;

function id() {
	return "id";
}

router
	.get("/user/settings", id)
	.get("/user/:name", id)


router.dispatch({method: "GET", url: "/user/chrisdotcode"});

var util = require("util");
console.log(util.inspect(_routes, {depth: null, colors: true}));

"/user/chrisdotcode"

"/user/settings"
"/user/:user"
