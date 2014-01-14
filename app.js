/*
 *
 * TODO:
 * - Edit products
 * - Send emails
 * - Send message to seller
 * - Browse products on post page
 */

var config = require("./config");

var express = require("express");
var http = require("http");
var path = require("path");
var fs = require("fs");
var sys = require("sys")
var cluster = require("cluster");
var MongoClient = require("mongodb").MongoClient;
var ObjectID = require("mongodb").ObjectID;
var backbone = require("backbone");
var _ = require("underscore");
var validation = require("backbone-validation");
	_.extend(backbone.Model.prototype, validation.mixin);
var Product = require("./public/js/models/Product").Product;
var skip32 = new require("skip32").Skip32;
skip32 = new skip32([0x9b, 0x21, 0x96, 0xe, 0x1a, 0xcf, 0x24, 0x5f, 0x14, 0x93]);
var geo = require("geo");
	
// Initialize app
	
var app = express();

// Setup mongodb

var mongoUri = process.env.MONGO_PATH;

// App configuration

app.configure(function(){
	app.set("port", process.env.PORT || config.port);
	app.set("views", __dirname + "/views");
	app.set("view engine", "jade");
	
	// Misc helpers
	
	app.use(function(req, res, next){
		res.locals.config = config;
		res.locals.date = new Date();
		next();
	});
	
	app.use(express.cookieParser());
	app.use(express.session({
		secret: config.secret
	}));
	app.use(require("less-middleware")({ src: __dirname + "/public" }));
	app.use(express.static(path.join(__dirname, "public")));
	app.use(express.favicon());
	app.use(express.bodyParser());
	app.use(express.methodOverride());
});

app.configure("development", function(){
	app.use(express.errorHandler());
});

// Routes

app.get("/", function(req, res){
	res.render("index");
});

// Add a new product
// TODO: Handle standard form / no javascript posts

app.post("/product", function(req, res){
	var product = new Product(req.body);
	var valid = product.isValid(true);
	product.attributes.images = product.attributes.images || [];
	for(var ii = 0; ii < product.attributes.images.length; ii++){
		// FIXME
		if(!(/^http[s]?:\/\/(?:www.)?filepicker.io/i).test(product.attributes.images[ii].url)) valid = false;
	}
	if(valid){
		MongoClient.connect(mongoUri, function(error, db){
			if(error){ return console.log(error); }
			var collection = db.collection("products");
			collection.insert(product, function(error, result){
				if(error){ return console.log(error); }
				res.send(200, {msg: "success", id: product._id});
			});
		});
	}else{
		// Product has already been validated on the client so
		// assume this is something out of the ordinary / malicious
		// and just ignore it.
		res.send(500, {msg: "error"});
	}
});

// View a single product

app.get("/product/:id", function(req, res){
	MongoClient.connect(mongoUri, function(error, db){
		if(error){ return console.log(error); }
		var collection = db.collection("products");
		collection.findOne({_id: new ObjectID(req.params.id)}, function(error, product){
			if(error){ return console.log(error); }
			console.log("------");
			console.log(product);
			console.log("------");
			res.render("product", {product: product.attributes});
		});
	});
});

// Fetch a list of products, with an optional page offset

app.get("/products/latest/:page?", function(req, res){
	
});

app.get("/geocode", function(req, res){
	geo.geocoder(geo.google, req.query.address, false, function(address, latitude, longitude, details){
		res.send(JSON.stringify({
			address: address,
			latitude: latitude,
			longitude: longitude,
			details: details
		}));
	});
});

// Start the server!
 
var cpus = require("os").cpus().length;

if(cluster.isMaster){
	// Fork
	for(var ii = 0; ii <cpus; ii++){
		cluster.fork();
	}
	
	cluster.on("exit", function(worker, code, signal){
		console.log("worker " + worker.process.pid + " died");
		cluster.fork(); // Restart
	});
	
	cluster.on("online", function(worker){
		console.log("worker " + worker.process.pid + " online");
	});
}else{
	http.createServer(app).listen(app.get('port'), function(){
		console.log("Express server listening on port " + app.get('port'));
	});	
}

