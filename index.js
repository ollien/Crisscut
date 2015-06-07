var url = require('url');

const PATH_NOT_FOUND_ERROR = {
	errorCode:404,
	error:'$PATH is not a known route.'
}

const ARGUMENT_PATTERN = new RegExp(":[^ \/]*");

module.exports = Crisscut

function Crisscut(routes){
	if (routes!=undefined){
		this.routes = correctRoutes(routes);
	}
}

Crisscut.prototype.route = function(req,res,errCallback){
	var requestUrl = url.parse(req.url).pathname; //Removes any URL arguments from the path
	if (requestUrl[0]!=='/'){ //Urls should start with a /
		requestUrl = '/'+requestUrl;
	}
	if (requestUrl[requestUrl.length-1]==='/' && requestUrl.length>1){ //Urls should not end in a / unless they are /
		requestUrl = requestUrl.substring(0,requestUrl.length-1);
	}
	var urlSplit = requestUrl.split('/');
	var finalRoute = null;
	for (var i=0; i<Object.keys(this.routes).length; i++){
		var route = Object.keys(this.routes)[i];
		
		var routeSplit = route.split('/');
		var argumentIndexes = matchArrayIndexes(routeSplit, ARGUMENT_PATTERN);
		if (routeSplit.length===urlSplit.length){
			//Browse for arguments within each url, and replace them with what they actually are in the url.
			argumentIndexes.forEach(function(j){
				if (urlSplit[j].length>0){
					routeSplit[j] = urlSplit[j];	
				}
			});
			if (routeSplit.join('/')===urlSplit.join('/')){
				finalRoute = route;
				break;
			}
		}
	}
	if (finalRoute){
		console.log(requestUrl+"->"+finalRoute);
	}
	else{
		var pathError = PATH_NOT_FOUND_ERROR;
		pathError.error = pathError.error.replace("$PATH", requestUrl);	
		if (errCallback){
			errCallback(pathError);	
		}
		else{
			console.log(pathError);
		}
	}
}

function matchArrayIndexes(array,regexp){
	var matchingIndexes = []
	array.forEach(function(element,index){
		if (element.match(regexp)){
			matchingIndexes.push(index);
		}
	});
	return matchingIndexes;
}

function correctRoutes(routes){
	Object.keys(routes).forEach(function(route){
		var original = route;
		var value = routes[route];
		if (route[0]!=='/'){ //Routes must begin with a /
			route = '/'+route;
		}
		if (route[route.length-1]==='/' && route.length>1){ //Routes must not end with a /, unless of course, they are to the homepage.
			route = route.substring(0,route.length-1);
		}
		if (route!=original){
			delete routes[original];
			routes[route] = value;
		}
	});
	return routes;
}