var url = require("url")
var querystring = require("querystring")

module.exports = Crisscut

function Crisscut(routes){
	this.routeTree = {
		path:"/",
		type:"explicit",
		children:[],
		callback:undefined
	}
	if (routes!==undefined){
		routes = correctRoutes(routes)
		addRoutesToRouteTree(this,routes)	
		console.log(JSON.stringify(this.routeTree))
	}
}

Crisscut.prototype.route = function(req,res,errCallback){
	var parsedUrl = url.parse(req.url)
	var rawUrl = parsedUrl.pathname
	var rawArguments = parsedUrl.query
	var routeResult = findRouteFromUrl(this,rawUrl);
	if (routeResult!=null){
		var methods = routeResult.methods;
		var args = routeResult.args;
		var method = req.method.toLowerCase();
		var parsedUrlArgs = querystring.parse(rawArguments); 
		parsedUrlArgs = parsedUrlArgs === null ? {}:parsedUrlArgs
		if (methods.hasOwnProperty(method)){
			methods[method].apply({},[req,res].concat(args,parsedUrlArgs))
		}
		else if (methods.hasOwnProperty("on")){
			methods.on.apply({},[req,res].concat(args,parsedUrlArgs))
		}
		else if (errCallback!=null){
			errCallback(methodNotAllowed(rawUrl,method));
		}
	}
	else if (errCallback!=null){
		errCallback(pathNotFound(rawUrl))
	}
}
Crisscut.prototype.addRoute = function(method,route,func,callback){
	var result = findRouteInTree(this,route)
	method = method.toLowerCase();
	if (result!=null){
		result.functions[method] = func
	}
	else{
		var checkObj = {}
		checkObj[route] = {}
		checkObj[route][method] = func
		var corrected = correctRoute(checkObj)
		route = getKey(corrected)
		addRouteToRouteTree(this,route,corrected[route])
	}
	if (callback!=null){
		callback();
	}
}

Crisscut.prototype.on = function(route,func,callback){
	this.addRoute("on",route,func,callback);
	return this
}

Crisscut.prototype.get = function(route,func,callback){
	this.addRoute("get",route,func,callback);
	return this
}

Crisscut.prototype.post = function(route,func,callback){
	this.addRoute("post",route,func,callback);
	return this
}

Crisscut.prototype.put = function(route,func,callback){
	this.addRoute("put",route,func,callback);
	return this
}

Crisscut.prototype.delete = function(route,func,callback){
	this.addRoute("delete",route,func,callback);
	return this
}

Crisscut.prototype.trace = function(route,func,callback){
	this.addRoute("trace",route,func,callback);
	return this
}

Crisscut.prototype.options = function(route,func,callback){
	this.addRoute("options",route,func,callback);
	return this
}

Crisscut.prototype.connect = function(route,func,callback){
	this.addRoute("connect",route,func,callback);
	return this
}

Crisscut.prototype.patch = function(route,func,callback){
	this.addRoute("patch",route,func,callback);
	return this
}

function correctRoute(route){
	var key = getKey(route)
	if (key===null){
		return null;
	}
	var original = key
	var value = route[key]
	if (key[0]==="/" && key.length>1){ //Routes must not begin with a /, unless they are /
		key = key.substring(1)
	}
	if (key[key.length-1]==="/" && key.length>1){ //Routes must not end with a /, unless of course, they are to the homepage.
		key = key.substring(0,key.length-1)
	}
	if (key!==original){
		delete route[original]
		route[key] = value
	}
	if (typeof route[key] === "object"){
		Object.keys(route[key]).forEach(function(item){
			if (item!==item.toLowerCase()){
				var value = route[key][item]
				delete route[key][item]
				route[key][item.toLowerCase()] = value
			}
		})
	}
	return route
}

function correctRoutes(routes){
	Object.keys(routes).forEach(function(route){
		var obj = {}
		obj[route] = routes[route]
		var corrected = correctRoute(obj)	
		if (corrected===null){
			throw new Error("Error with object in correctRoutes")
		}
		delete routes[route]
		var key = getKey(corrected)
		routes[key] = corrected[key]
	})
	return routes
}


function addRouteToRouteTree(router,route,functions,parentNode){
	if (route.length===0){
		return; //No point in adding a route that literally is nothing.
	}
	if (route==="/"){ // We already have a root element pre-made, we can just add a function in
		router.routeTree.functions = functions
		return; 
	}
	var routeSplit = route.split("/")
	if (parentNode===undefined || parentNode===null){
		parentNode = router.routeTree
	}
	var index = findObjectWithPropertyValueInArray(parentNode.children, "path",routeSplit[0])
	if (index>-1){
		routeSplit.shift()
		if (routeSplit.length>0){
			addRouteToRouteTree(router,routeSplit.join("/"), functions, parentNode.children[index])
		}
		else{
			parentNode.children[index].functions = functions
		}
	}
	else{
		var type = routeSplit[0][0]===":" ? "variable":"explicit"
		var wild = false
		if (type==="variable"){
			if (routeSplit[0][1]==="(" && routeSplit[0][routeSplit[0].length-1]===")"){
				type = "regex"
			}
			else if (routeSplit[0][1]==="(" && routeSplit[0][routeSplit[0].length-2]===")" && routeSplit[0][routeSplit[0].length-1]==="*"){
				type = "regex"
				wild = true
			}
		}
		if (type==="variable"){
			index = findObjectWithPropertyValueInArray(parentNode.children, "type", "variable")
			if (index>-1){
				routeSplit.shift()
				addRouteToRouteTree(router,routeSplit.join("/"), functions, parentNode.children[index])
			}
			else{
				var leaf = createLeaf(routeSplit[0], type,false)
				parentNode.children.push(leaf)
				routeSplit.shift()
				if (routeSplit.length>0){
					addRouteToRouteTree(router,routeSplit.join("/"), functions, leaf)
				}
				else{
					leaf.functions = functions
				}
			}
		}
		else{
			var leaf = createLeaf(routeSplit[0], type,wild)
			parentNode.children.push(leaf)
			routeSplit.shift()
			if (routeSplit.length>0){
				addRouteToRouteTree(router,routeSplit.join("/"), functions, leaf)
			}
			else{
				leaf.functions = functions
			}
		}
	}
}

function addRoutesToRouteTree(router,routes){
	Object.keys(routes).forEach(function(route){
		addRouteToRouteTree(router,route,routes[route])
	})
}

function findRouteFromUrl(router,url,parentNode,args){
	if (parentNode===null || parentNode===undefined){
		parentNode = router.routeTree
	}
	if (args===null || args===undefined){
		args = []
	}
	if (url==="/"){
		if (parentNode.functions==null){
			return null;
		}
		else{
			return {
				methods:parentNode.functions,
				args:args
			}
		}
	}
	else{
		if (url[0]==="/"){
			url = url.substring(1);	
		} 
		if (url[url.length-1]==="/"){
			url = url.substring(0,url.length-1)
		}
		
	}
	var urlSplit = url.split("/")
	var index = findObjectWithPropertyValueInArray(parentNode.children, "path", urlSplit[0])
	//If we have an explicit route, use it, otherwise, we need to do some searching.
	if (index>-1){
		urlSplit.shift()
		if (urlSplit.length>0){
			return findRouteFromUrl(router,urlSplit.join("/"), parentNode.children[index],args)
		}
		else{
			var methods = parentNode.children[index].functions
			if (methods===null || methods===undefined){
				return null
			}

			return {
				methods:methods,
				args:args
			}
		}
	}
	else{
		var regexIndexes = findObjectsWithPropertyValueInArray(parentNode.children, "type", "regex")
		var variableIndex = findObjectWithPropertyValueInArray(parentNode.children, "type", "variable") //There should only ever be one variable in the tree.
		for (var i=0; i<regexIndexes.length; i++){
			var index = regexIndexes[i];
			var regex = parentNode.children[index].wild ? parentNode.children[index].path.substring(1,parentNode.children[index].path.length-1):parentNode.children[index].path.substring(1)
			var match = urlSplit[0].match(regex);
			if (match && match[0]===urlSplit[0]){
				//We need to check if the regex was wildcard, in which case we need to keep going through the loop
				if (parentNode.children[index].wild){
					var matches = []
					matches.push(urlSplit[0])
					urlSplit.shift();
					while(urlSplit.length>0){
						match = urlSplit[0].match(regex)
						if (match && match[0]===urlSplit[0]){
							matches.push(urlSplit[0])
							urlSplit.shift()
						}
						else{
							break
						}
					}
					args.push(matches.join('/'))
				}
				else{
					args.push(urlSplit[0])
					urlSplit.shift()
				}
				if (urlSplit.length>0){
					return findRouteFromUrl(router,urlSplit.join("/"), parentNode.children[index],args)
				}
				else{
					var methods = parentNode.children[index].functions
					if (methods===null || methods===undefined){
						//return null
						//If it turns out there's nothing for this route, we shouldn't use it. In this case, we take out the argument and throw them back into urlSplit
						urlSplit.push(args.pop())
						continue;
					}

					return {
						methods:methods,
						args:args
					}
				}
			}
		}
		//If we haven't matched regex, we can see if we have a variable. otherwise, we return null.
		if (variableIndex>-1){
			args.push(urlSplit[0])
			urlSplit.shift()
			if (urlSplit.length>0){
				return findRouteFromUrl(router,urlSplit.join("/"),parentNode.children[variableIndex],args)
			}
			else{
				var methods = parentNode.children[variableIndex].functions
				if (methods===null || methods===undefined){
					return null
				}

				return {
					methods:methods,
					args:args
				}
			}
		}	
	}
}

function createLeaf(name,type,wild,functions){
	return {
		path:name,
		type:type,
		wild:wild,
		children:[],
		functions:functions,
	}
}

function findRouteInTree(router,route,parentNode){
	if (parentNode===undefined || parentNode===null){
		parentNode = router.routeTree
	}		
	if (route==="/"){
		return parentNode
	} 
	var routeSplit = route.split('/')
	var index = findObjectWithPropertyValueInArray(parentNode.children, "path", routeSplit[0])
	if (index>-1){
		routeSplit.shift()
		if (routeSplit.length>0){
			return findRouteInTree(router,routeSplit.join('/'),parentNode.children[index])
		}
		else{
			return parentNode.children[index]
		}
	}
	//This checks if we need to find a variable. Regex is already checked for with the above block
	else if (routeSplit[0][0]===":"){ 
		index = findObjectWithPropertyValueInArray(parentNode.children,"type","variable")
		if (index>-1){
			routeSplit.shift()
			if (routeSplit.length>0){
				return findRouteInTree(router,routeSplit.join('/'),parentNode.children[index])
			}
			else{
				return parentNode.children[index]
			}
		}
	}
	return null
	
}

function pathNotFound(path){
	return {
		errorCode:404,
		error:path+" is not a known route."
	}
}
function methodNotAllowed(path,method){
	return {
		errorCode:405,
		error: method.toUpperCase()+" is not allowed on "+path
	}

}
function arrayHasObjectWithProperty(array,property){
	for (var i = 0; i<array.length; i++){
		if (array[i].hasOwnProperty(property)){
			return true
		}
	}
	return false
}

function arrayHasObjectWithPropertyValue(array,property,value){
	for (var i = 0; i<array.length; i++){
		if (array[i].hasOwnProperty(property) && array[i][property]===value){
			return false
		}
	}
	return true
}

function findObjectWithPropertyValueInArray(array,property,value){
	for (var i = 0; i<array.length; i++){
		if (array[i].hasOwnProperty(property) && array[i][property]===value){
			return i
		}
	}
	return -1
}

function findObjectsWithPropertyValueInArray(array,property,value){
	var results = []
	for (var i = 0; i<array.length; i++){
		if (array[i].hasOwnProperty(property) && array[i][property]===value){
			results.push(i)
		}
	}
	return results
}

function getKey(obj){
	var keys = Object.keys(obj);

	if (keys.length===1){
		return keys[0]
	}
	else{
		return null;
	}
}

function clone(object){
	return JSON.parse(JSON.stringify(object))
}
