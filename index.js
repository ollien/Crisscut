var url = require('url');

const PATH_NOT_FOUND_ERROR = {
	errorCode:404,
	error:'$PATH is not a known route.'
}

const ARGUMENT_PATTERN = new RegExp(":[^ \/]*");

module.exports = Timpani

function Timpani(routes){
	if (routes!=undefined){
		this.routes = routes;
	}
}

Timpani.prototype.route = function(req,res,errCallback){
	var requestUrl = url.parse(req.url).pathname; //Removes any URL arguments from the path
	if (requestUrl[0]!='/'){
		requestUrl = '/'+requestUrl;
	}
	var urlSplit = requestUrl.split('/');
	var finalRoute = null;
	for (var i=0; i<Object.keys(this.routes).length; i++){
		var route = Object.keys(this.routes)[i];
		if (route[0]!='/'){
			route = '/'+route;
		}
		if (route[route.length-1]==='/' && route.length>1){
			route = route.substring(0,route.length-1);
		}
		var routeSplit = route.split('/');
		var argumentIndexes = matchArrayIndexes(routeSplit, ARGUMENT_PATTERN);
		if (routeSplit.length===urlSplit.length){
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