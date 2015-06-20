"use strict";

var url = require("url");

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
			if (pathSegment.indexOf(":") !== -1) {
				// pathSegment = ":variable";
			}
			__routes[pathSegment] = __routes[pathSegment] || {}; //not sure how well this will work like this, but try it. // there can only be one :variable per route, that is /user/:name and /user/:foobar are treated as the same
			prev = __routes[pathSegment];
			end = __routes;
			lastPath = pathSegment;
			return prev;
		}, prev);
		// set the last pathSegment match equal to the function
		end[lastPath].fn = fn;

		return this;
	},
	dispatch: function(req, res) {
		var url_ = url.parse(req.url, true);
		var method = req.method.toLowerCase();
		if (!method in _routes) {
			return 405; // XXX
		}
		var absoluteMatch = _routes[method].absolute[url_.pathname];
		if (absoluteMatch) { // absolutePaths are matched first
			absoluteMatch(req, res, url_.query);
			return this; // return this, or path match?
		}
		var next = _routes[method].relative;
		var argList = [];
		var matched = false;
		url_.pathname.split("/").forEach(function(segment) {
			if (!segment) { // skip blank path segments
				return;
			}

			var hero = Object.keys(next).filter(function(x) { return x.indexOf(':') === 0; }); // only one is counted, the rest are overwritten by this path, by logical necessity; otherwise, there's no other way to disambiguate between "/user/:name" and "/user/:foo"
			if (hero.length > 0) { // there is a key in this current level that has a ":" in it
				matched = true; // type conversions?
				argList.push(segment);
				next = next[hero[hero.length - 1]];
			} else if (next[segment]) {
				matched = true;
				next = next[segment];
			} else {
				matched = false;
				// break-out
			}
		});
		if (matched) {
			next.fn.apply({}, [req, res].concat(argList, url_.query));
			return this; // return this?
		} else {
			return 404; // XXX
		}
	},
};

module.exports = router;

function id(req, res, params) {
	console.log(req, res, params);
}

function idName(req, res, name, params) {
	console.log("id: ", req, res, name, params);
}

function fooName(req, res, name, params) {
	console.log("foo: ", req, res, name, params);
}

function idNameAge(req, res, name, age, params) {
	console.log(req, res, name, age, params);
}

router
	.get("/user/settings", id)
	.get("/user/:name", idName)
	.get("/user/:foobar", fooName) // overwrites the above
	.get("/user/:name/:age", idNameAge)

function u(i) {
	console.log(require("util").inspect(i, {depth: null, colors: true}));
}

// router.dispatch({method: "GET", url: "/user/settings?min=20&max=40&no_track"}, {"res": true});
router.dispatch({method: "GET", url: "/user/chrisdotcode?min=20&max=40&no_track"}, {"res": true});
// router.dispatch({method: "GET", url: "/user/chrisdotcode/22?min=20&max=40&no_track"}, {"res": true});
