var url = require('url');

const PATH_NOT_FOUND_ERROR = {
	errorCode:404,
	error:'$PATH is not a known route.'
}
const METHOD_NOT_ALLOWED_ERROR = {
	errorCode:405,
	error:'$METHOD is not allowed on $PATH'
}

const ARGUMENT_PATTERN = new RegExp(":[^ \/]*");

module.exports = Crisscut

function Crisscut(routes){
	if (routes!==undefined){
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
	var finalRoute = null;
	for (var i=0; i<Object.keys(this.routes).length; i++){
		var route = Object.keys(this.routes)[i];
		var result = createRouteSplit(route, requestUrl.split('/'));
		var routeSplit = result.routeSplit;
		var argumentIndexes = result.argumentIndexes;
		if (routeSplit.join('/')===requestUrl){
			finalRoute = route;
			break;
		}
	}
	if (finalRoute){
		var urlArguments = returnArrayFromArrayIndexesObject(routeSplit,argumentIndexes);
		var routeMethods = this.routes[finalRoute];
		var method = req.method.toLowerCase();
		if (routeMethods.hasOwnProperty(method)){
			routeMethods[method].apply({},[req,res].concat(urlArguments));
		}
		else{
			if (routeMethods.hasOwnProperty('on')){
				routeMethods.on.apply({},[req,res].concat(urlArguments))
			}
			else{
				var pathError = clone(METHOD_NOT_ALLOWED_ERROR);
				pathError.error = pathError.error.replace("$PATH",requestUrl);
				pathError.error = pathError.error.replace("$METHOD",method.toUpperCase());
				if (errCallback){
					errCallback(pathError);
				}
			}
		}
	}
	else{
		var pathError = clone(PATH_NOT_FOUND_ERROR);
		pathError.error = pathError.error.replace("$PATH", requestUrl);	
		if (errCallback){
			errCallback(pathError);	
		}
	}
}

Crisscut.prototype.addRoute = function(method,route,routeCallback){
	method = method.toLowerCase();
	route = route.toLowerCase();
	if (!this.routes.hasOwnProperty(route)){
		this.routes[route] = {}
	}
	this.routes[route][method] = routeCallback;
}

function matchArrayIndexes(array,regexp){
	var matchingIndexes = []
	array.forEach(function(element,index){
		if ((element[1]==="(" || element[2]==="(") && element[element.length-1]===")"){
			matchingIndexes.push({index:index,type:"regex"})
		}
		else if (element.match(regexp)){
			matchingIndexes.push({index:index,type:"string"});
		}
		
	});
	return matchingIndexes;
}

function returnArrayFromArrayIndexesObject(array,indexes){
	var items = [];
	indexes.forEach(function(item){
		items.push(array[item.index]);
	});
	return items;
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
		Object.keys(routes[route]).forEach(function(item){
			if (item!=item.toLowerCase()){
				var value = routes[route][item];
				delete routes[route][item];
				routes[route][item.toLowerCase()] = value;
			}
		})
	});
	return routes;
}

function createRouteSplit(route,urlSplit){
	var routeSplit = route.split('/');
	var argumentIndexes = matchArrayIndexes(routeSplit, ARGUMENT_PATTERN);
	var regexDelta = 0;
	if (routeSplit.length===urlSplit.length || arrayHasObjectWithPropertyValue(argumentIndexes,"type","regex")){
		//Browse for arguments within each url, and replace them with what they actually are in the url.
		for (var j = 0; j<argumentIndexes.length; j++){
			var index = argumentIndexes[j];
			var origIndex = index.index;
			var offsetIndex = index.index+regexDelta;
			if (index.type==="string" && offsetIndex<urlSplit.length){
				if (urlSplit[offsetIndex].length>0){
					routeSplit[origIndex] = urlSplit[offsetIndex];
				}
			}
			else if (index.type==="regex"){
				var routeResult = regexArgument(clone(urlSplit), clone(routeSplit), origIndex, regexDelta);
				urlSplit = routeResult.urlSplit;
				routeSplit = routeResult.routeSplit;
				regexDelta = routeResult.regexDelta;
			}
			if (routeSplit[origIndex][routeSplit[origIndex].length-1]==="/"){
				routeSplit[origIndex] = routeSplit[origIndex].substring(0,routeSplit[origIndex].length-1);
			}
		}
	}
	var returnValue = {
		routeSplit:routeSplit,
		argumentIndexes:argumentIndexes
	}
	return returnValue;
}

function regexArgument(urlSplit,routeSplit,origIndex,regexDelta){
	var offsetIndex = origIndex+regexDelta;
	//If ! prefixes any regex group, it should only be matched once
	if (routeSplit[origIndex][1]!=="!"){
		var regex = routeSplit[origIndex].substring(2,routeSplit[origIndex].length-1);	
		var oneOnly = false;
	}
	else{
		var regex = routeSplit[origIndex].substring(3,routeSplit[origIndex].length-1);
		var oneOnly = true;
	}
	routeSplit[origIndex] = ""
	//Search for regex matches in every section of the url
	for (var l = offsetIndex; (oneOnly ? l<offsetIndex+1 && l<urlSplit.length:l<urlSplit.length); l++){
		var match = urlSplit[l].match(regex);
		if (	match && match[0]===urlSplit[l]){
			routeSplit[origIndex]+=urlSplit[l];
			if (l!=urlSplit.length-1 && !oneOnly){
				routeSplit[origIndex]+="/";
			}
		}
		else{
			if (l!=offsetIndex){
				regexDelta+=(l-offsetIndex)-1;
			}
			break;
		}
	}
	var returnValues = {
		routeSplit:routeSplit,
		urlSplit:urlSplit,
		regexDelta:regexDelta
	}
	return returnValues;
}

function arrayHasObjectWithProperty(array,property){
	for (var i = 0; i<array.length; i++){
		if (array[i].hasOwnProperty(property)){
			return true;
		}
	}
	return false;
}

function arrayHasObjectWithPropertyValue(array,property,value){
	for (var i = 0; i<array.length; i++){
		if (array[i].hasOwnProperty(property) && array[i][property]===value){
			return true;
		}
	}
	return false;
}

function clone(object){
	return JSON.parse(JSON.stringify(object));
}