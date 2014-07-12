/*	
 *	API route specifications and handler functions
 */

// Required Node modules
var express 	= require('express');
var app 		= express();
var bodyParser 	= require('body-parser');
var mongoose 	= require('mongoose');
mongoose.connect('mongodb://localhost:27017/api');

// Required Models
var Trend		= require('./app/models/trend');

// Body parser is used to process data from a POST request
app.use(bodyParser());

var port = process.env.PORT || 8080;

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

//===================================
//	END ROUTES
//===================================

// All routes will be prefixed with '/api'
app.use('/api/dev', router);

// Listen for requests
app.listen(port);

console.log("API now listening on port: " + port);