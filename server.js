/*	
 *	API route specifications and handler functions
 */

// Required Node modules
var express 		= require('express');
var app 			= express();
var bodyParser 		= require('body-parser');
var mongoose 		= require('mongoose');
mongoose.connect('mongodb://localhost:27017/api');

// Required Models
var Trend			= require('./app/models/trend');
var User 			= require('./app/models/user');
var Message 		= require('./app/models/message');

// Import request functionality
var TrendRequest 	= require('./app/trend_request');

// Define API listening port
var port = process.env.PORT || 8080;

// Body parser is used to process data from a POST request
app.use(bodyParser());

//===================================
//	ROUTES
//===================================
var router = express.Router();

// Middleware for all requests
router.use(function(req, res, next){
	console.log("Something happened");
	next();
});

// Simple API route and response function
router.get('/', function(req, res) {
	res.json({message: 'Wecome to the api!'});
});

// ---- /trends ----
router.route('/trends')
	.post(function(req, res) {
		var trend = new Trend();
		trend.name = req.body.name;

		trend.save(function(err) {
			if (err)
				res.send(err);

			res.json({ message: 'Trend Created' });
		});
	})

	.get(function(req, res) {
		Trend.find({}, 'trend source',function(err, trends) {
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

		TrendRequest.twitter(lat, lon);
		res.json({ message: "Check the console" });
	});

// ---- /users ----
router.route('/users')
	.post(function(req, res) {
		var user = new User();
		user.name = req.query.username;
		user.online = true;

		user.save(function(err){
			if (err)
				res.send(err);

			res.ok();
		});
	});

// ---- /messages/:trend ----
router.route('/messages/:trend')
	.post(function(req, res){
		var message = new Message();
		message.message = req.query.message;
		message.trend = req.params.trend;
		message.user = req.query.userid;
	});

//===================================
//	END ROUTES
//===================================

// All routes will be prefixed with '/api'
app.use('/api/dev', router);

// Listen for requests
app.listen(port);

console.log("API now listening on port: " + port);