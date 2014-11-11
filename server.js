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
var bcrypt		= require('bcrypt');
var randtoken = require('rand-token').uid;

var mongourl = process.env.MONGOLAB_URI || process.env.MONGOHQ_URL || 'mongodb://localhost:27017/api';
mongoose.connect(mongourl);

// Hash salt
var salt = 'trendchattr-api';

// Required Models
var Chatroom		= require('./app/models/chatroom');
var User 			= require('./app/models/user');
var Message 		= require('./app/models/message');

// Import request functionality
var TrendRequest 	= require('./app/trend_request');

var fatalError = "An error has occurred, please try again later";

// Body parser is used to process data from a POST request
app.use(bodyParser.json());

// Set CORS Headers (changing this will break socket.io functionality)
var corsOptions = {
	origin: true,
	credentials: true
}

app.use(cors(corsOptions));

//===================================
//	AUTHENTICATE USERS
//===================================
var requireApiToken = function(req,res,next) {
	if (req.get('authorization')) {
		User.findOne({token: req.get('authorization')}, function(err, doc){
			if (err)
				res.status(500).send(err);
			else if (doc) {
				next();
			} else {
				res.status(401).end();
			}
		});
	} else {
		res.status(401).send("Invalid Token")
	}
};

//===================================
//	SOCKET IO EVENT ROUTES
//===================================
var chat = io.of('/').on('connection', function(socket){
	console.log("User Connected");

	socket.on('message', function(msg) {
		// Send to all but self
		socket.join(msg.chatroom.chatroom);
		console.log(msg);
		socket.broadcast.to(msg.chatroom.chatroom).emit('message', msg);
	});

	socket.on('join', function(chatroom) {
		socket.join(chatroom);
	});

	socket.on('error', function(error) {
		console.log(error);
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
	res.sendFile(process.cwd() + '/apiref.html');
});

// ---- /chatrooms ----
router.route('/chatrooms')
	.get(requireApiToken, function(req, res) {
		TrendRequest.twitterGlobal();
		Chatroom.find({}, 'id chatroom source',function(err, trends) {
			if (err)
				res.send(err);

			res.json(trends);
		});
	});

// ---- /trends/location ----
router.route('/chatrooms/location')
	.get(requireApiToken, function(req, res) {
		var lat = req.query.lat;
		var lon = req.query.lon;

		TrendRequest.twitterLocation(lat, lon);
		res.json({ message: "Check the console" });
	});

// ---- /users ---- (No Longer works)
// router.route('/users/:username')
// 	.post(function(req, res) {
// 		var user = new User();
// 		user._id = req.params.username;
// 		user.online = true;
//
// 		user.save(function(err){
// 			if (err)
// 				res.send(err);
//
// 			res.send("User Created");
// 		});
// 	});

// ---- /messages/:trend ----
router.route('/messages/:chatroom')
	.post(requireApiToken, function(req, res){
		var message = new Message();
		message.message = req.body.message;
		message.chatroom = req.params.chatroom;
		message.username = req.body.username;

		message.save(function(err){
			if (err)
				res.send(err);

			res.send("Message Stored");
		});
	})

	.get(requireApiToken, function(req, res){
		Message.find({chatroom: req.params.chatroom},"user message sent", function(err, messages){
			res.json(messages);
		});
	});


// ---- /register ----
router.route('/register')
	.post(function(req, res){
		// Check if username already exists
		User.findOne({username: req.body.username}, function(err, doc){
			if (doc) {
				res.status(401).send({"userMessage":"Username already exists",
															"devMessage": "Username already exists"});
			} else if (err) {
				res.status(500).send({"userMessage": fatalError,
															"devMessage": err});
			} else {
				// Check to see if email is already registered
				User.findOne({email: req.body.email}, function(err, doc){
					if (doc) {
						res.status(401).send({"userMessage": "Email already taken",
																	"devMessage": "Email already taken"});
					} else if (err) {
						res.status(500).send({"userMessage": fatalError,
																	"devMessage": err});
					} else {
						// User doesn't exist and email isn't used
						var NewUser = new User(); // Create a new User model instance

						NewUser.fullname = req.body.fullname;

						// Were all the required fields supplied?
						if(!req.body.username || req.body.username === ""){
							res.status(401).send({"userMessage":"Username cannot be empty",
																		"devMessage":"Username cannot be empty"});
						}	else if (!req.body.email || req.body.email ===""){
							res.status(401).send({"userMessage":"Email cannot be empty",
																		"devMessage": "Email cannot be empty"});
						} else if (!req.body.password || req.body.password ===""){
							res.status(401).send({"userMessage":"Password cannot be empty",
																		"devMessage":"Password cannot be empty"});
						} else {
							NewUser.username = req.body.username;
							NewUser.email = req.body.email;

							bcrypt.genSalt(10, function(err, salt){
								bcrypt.hash(req.body.password, salt, function(err, hash){
									if (err) {
										res.status(500).send({"devMessage": err,
																					"userMessage": fatalError});
									} else {
										NewUser.passwordhash = hash;
										NewUser.token = null;
										NewUser.save(function(err){
											if (err)
												res.send({"userMessage": fatalError,
																	"devMessage": err});
											else
												res.send({"userMessage": "Registration Successful",
																	"devMessage": "Registration Successful"});
										});
									}
								});
							});
						}
					}
				});
			}
		});
	});

router.route('/login')
	.post(function(req,res){
		if (req.body.username && req.body.password) {
			User.findOne({username: req.body.username}, function(err, doc) {
				if (err)
					res.status(500).send({"error": err});
				else if (!doc) {
					res.status(401).send({"message": "Username or password incorrect"});
				} else {
					bcrypt.compare(req.body.password, doc.passwordhash, function(err, auth){
						if (auth) {
							// Generate a UID token
							var token = randtoken(16);
							var response = {
								"username": doc.username,
								"token": token
							}
							res.send(response);
							doc.token = token;
							doc.save();
						} else {
							res.status(401).send({"message": "Username or password incorrect"});
						}
					});
				}
			});
		} else {
			res.status(401).send({"message": "Must supply username and password"});
		}
	});

router.route('/logout')
	.post(function(req,res){
		if (req.get('authorization')){
			User.findOne({token: req.get('authorization')}, function(err, doc){
				if (err)
					res.status(500).send(err);
				else if (doc) {
					doc.token = null;
					doc.save();
					res.send(true);
				} else {
					res.send(false);
				}
			});
		} else {
			res.send(true);
		}
	});

//===================================
//	END ROUTES
//===================================
// All routes will be prefixed with '/'
app.use('/', router);

console.log("API now listening on port: " + port);
