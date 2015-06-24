# Crisscut
A simplistic router for Node.js

So you need a router for Node? Look no further than Crisscut!

Setting up Crisscut is easy.

```
var http = require("http")
var Crisscut = require("crisscut")
//You can set up your routes with a routing table like so
var routes = {
	//Explicit route example
	"/helloWorld":{
		//Just define what method you want to use!
		get:function(req,res){
			res.writeHead({"Content-Type":"text/plain"})
			res.end("Hello world!")
		},
		//We can also use 'on' as a catchall for all requests that aren't already defined. For example, a POST would end up in this function
		on:function(req,res){
			res.writeHead({"Content-Type":"text/plain"})
			res.end("Hello strange method!")
		}
	},
	//Of course, your routes can have variables in your routes
	"/user/:name":{
		//If we were to GET /user/ollien, we would get returned the text "Hello ollien!"
		get:function(req,res,name){
			res.writeHead({"Content-Type":"text/plain"})
			res.end("Hello "+name+"!")
		}
	},
	//Or, if you want to use regex, that's fine too! Just put your regex in prands, like so
	"/user/:([0-9]+)":{
		get:function(req,res,userId){
			res.writeHead({"Content-Type":"text/plain"})
			res.end("Hello user "+userId+"!")
		}
	}
	//You can even have this regex match over multiple components of your url.
	"/file/:(.*)*":{ 
		//If we were to GET /file/img/watermelon.png, we would be returned the text "You requested img/watermelon.png"
		get:function(req,res,path){
			res.writeHead({"Content-Type":"text/plain"})
			res.end("You requested "+path")
		}
	}
}
var router = new Crisscut(routes)

//Of course if you prefer, you can add a route on the fly after the router is defined.
router.get('/',function(req,res){
	res.writeHead({"Content-Type":"text/plain"})
	res.end("Hello!")
})


http.createServer(function(req,res){
	router.route(req,res,function(err){
		if (err){
			console.log(err)
		}
	})
}).listen(8080,'127.0.0.1');

```
##Route syntax
Syntax | Description | Example URL
-------|------------ | -----------
`/my/route` | An basic route | http://example.com/my/route
`/my/route/:variable` | A route that contains a variable | http://example.com/my/route/hello
`/my/route/:([0-9]+)` | A route that will only match [0-9]+ as a variable | http://example.com/my/route/59
`/my/route/:([0-9]+)*` | A route that will only match [0-9]+ as a variable, as well as any other subseqent parts of the route that match the regex.  | http://example.com/my/route/59/82


##Method Documentation
Method | Description
--------|---------
`Crisscut([routes])` | Basic constructor for Crisscut.
`Crisscut.prototype.route(req,res,[errcallback])` | Route requests to Crisscut
`Crisscut.prototype.addRoute(method,route,routeFunction,[callback])` | Add a route to Crisscut
`Crisscut.prototype.on(route,routeFunction,[callback])` | Add a wildcard route to Crisscut
`Crisscut.prototype.get(route,routeFunction,[callback])` | Add a GET route to Crisscut
`Crisscut.prototype.post(route,routeFunction,[callback])` | Add a POST route to Crisscut
`Crisscut.prototype.put(route,routeFunction,[callback])` | Add a PUT route to Crisscut
`Crisscut.prototype.delete(route,routeFunction,[callback])` | Add a DELETE route to Crisscut
`Crisscut.prototype.trace(route,routeFunction,[callback])` | Add a TRACE route to Crisscut
`Crisscut.prototype.connect(route,routeFunction,[callback])` | Add a CONNECT route to Crisscut
`Crisscut.prototype.path(route,routeFunction,[callback])` | Add a PATCH route to Crisscut
