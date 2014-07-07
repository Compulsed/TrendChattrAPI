/*	
 *	API route specifications and handler functions
 */

// Required Node modules
var express 	= require('express');
var app 		= express();
var bodyParser 	= require('body-parser');
var mongoose 	= require('mongoose');

// Body parser is used to process data from a POST request
app.use(bodyParser());

var port = process.env.PORT || 8080;

//===================================
//	ROUTES
//===================================
var router = express.Router();

// Simple API route and response function
router.get('/', function(req, res) {
	res.json({message: 'hooray! Wecome to the api!'});
});

//===================================
//	END ROUTES
//===================================

// All routes will be prefixed with '/api'
app.use('/api', router);

// Listen for requests
app.listen(port);

console.log("API now listening on port: " + port);