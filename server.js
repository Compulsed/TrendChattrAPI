/*	
 *	API route specifications and handler functions
 */

// Define API listening port
var port = process.env.PORT || 8080;

// Required Node modules
var express 		= require('express');
var app 			= express();
var http			= require('http').Server(app);
var server 			= app.listen(port);
var io 				= require('socket.io').listen(server);
var cors			= require('cors');
var bodyParser 		= require('body-parser');
var mongoose 		= require('mongoose');
mongoose.connect('mongodb://localhost:27017/api');

// Required Models
var Trend			= require('./app/models/trend');
var User 			= require('./app/models/user');
var Message 		= require('./app/models/message');

// Import request functionality
var TrendRequest 	= require('./app/trend_request');

// Body parser is used to process data from a POST request
app.use(bodyParser());

var corsOptions = {
	origin: true,
	credentials: true
}

app.use(cors(corsOptions));
//===================================
//	SOCKET IO EVENT ROUTES
//===================================
var chat = io.of('/').on('connection', function(socket){
	console.log("User Connected");
	socket.on('message', function(msg){

	});
});

//===================================
//	ROUTES
//===================================
var router = express.Router();

// Middleware for all requests
router.use(function(req, res, next){
	res.setHeader("Access-Control-Allow-Credentials", "true");
	console.log("Got request");
	next();
});

// Simple API route and response function
router.get('/', function(req, res) {
	res.sendfile('apiref.html');
});

// ---- /trends ----
router.route('/trends')
	.get(function(req, res) {
		TrendRequest.twitterGlobal();
		Trend.find({}, '_id source',function(err, trends) {
			if (err)
				res.send(err);

			res.json(trends);
		});
	});

// ---- /trends/location ----
router.route('/trends/location')
	.get(function(req, res) {
		var lat = req.query.lat;
		var lon = req.query.lon;

		TrendRequest.twitterLocation(lat, lon);
		res.json({ message: "Check the console" });
	});

// ---- /users ----
router.route('/users/:username')
	.post(function(req, res) {
		var user = new User();
		user._id = req.params.username;
		user.online = true;

		user.save(function(err){
			if (err)
				res.send(err);

			res.send("User Created");
		});
	});

// ---- /messages/:trend ----
router.route('/messages/:trend')
	.post(function(req, res){
		var message = new Message();
		message.message = req.body.message;
		message.trend = req.params.trend;
		message.user = req.body.user;
		
		message.save(function(err){
			if (err)
				res.send(err);

			res.send("Message Stored");
		});
	})

	.get(function(req, res){
		Message.find({trend: req.params.trend},"user message sent", function(err, messages){
			res.json(messages);
		});
	});

//===================================
//	END ROUTES
//===================================

// All routes will be prefixed with '/api'
app.use('/api/dev', router);

// // Listen for requests
// app.listen(port);

console.log("API now listening on port: " + port);