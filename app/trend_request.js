var https 		= require('https');
var mongoose	= require('mongoose');
var AuthToken 	= require('./models/auth_token');

//===================================
//	Twitter Auth Credentials
//===================================
var twitterConsumerKey = encodeURIComponent("FkYMquZ0aRz2tiQgQ6RkwRta0");
var twitterConsumerSecret = encodeURIComponent("K0SgrvidjSEHEdhr8KOJhFd2MPsh5bPMakLkJu9OErdOcfOhwr");

var twitterBearerCredentials = twitterConsumerKey + ":" + twitterConsumerSecret;
var twitterBase64Credentials = new Buffer(twitterBearerCredentials).toString('base64'); 

//===================================
//	Auth Tokens
//===================================

// Get the existing (cached) token if it exists.
function getToken(apiName, callback){
	AuthToken.findOne( { api: apiName }, function(err, doc) {
		if (err || doc == null) {
			return callback(err);
		} else {
			return callback(null, doc.token);
		}
	});
}

// Authenticate with twitter
function twitterAuthenticate(){
	getToken("twitter", function(err, twitterAuthToken) {
		if (err) {
			console.log(err);
		} else {
			if (!twitterAuthToken || twitterAuthToken === "" || twitterAuthToken === undefined){
				var options = {
					host: 'api.twitter.com',
					path: '/oauth2/token',
					port: 443,
					method: 'POST',
					headers: {
						"Authorization": 'Basic ' + twitterBase64Credentials,
						'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8'
					}
				};

				var req = https.request(options, function(res) {
					var responseData = '';

					res.on('data', function(chunk) {
						responseData += chunk;
					});

					res.on('end', function() {
						var body = JSON.parse(responseData);
						twitterAuthToken = body.access_token;
						var twitterAuth = new AuthToken;
						twitterAuth.api = "twitter";
						twitterAuth.token = twitterAuthToken;
						twitterAuth.save(function(err) {
							if (err) {
								console.log(err);
							}
						});
					});
				});

				req.write('grant_type=client_credentials');
				req.end();
			}
		}
	});
	
}

// Get the current trends from twitter
function twitterTrends(lat, lon) {
	getToken("twitter", function(err, twitterAuthToken) {
		if (err) {
			console.log(err);
		} else {
			if (twitterAuthToken === "" || !twitterAuthToken){
				console.log("twitterAuthToken is empty");
			} else {
				var options = {
					host: 'api.twitter.com',
					path: '/1.1/trends/closest.json?lat=' + lat + '&long=' + lon,
					port: 443,
					method: 'GET',
					headers: {
						'Authorization': 'Bearer ' + twitterAuthToken
					}
				};

				console.log(options);

				var req = https.request(options, function(res) {
					var responseData = '';

					res.on('data', function(chunk) {
						responseData += chunk;
					});

					res.on('end', function() {
						console.log("got here");
						console.log(responseData);
					});
				});
				req.end();
			}
		}
	});

}

module.exports.twitter = function (lat, lon){
		twitterAuthenticate();
		twitterTrends(lat, lon);
};
