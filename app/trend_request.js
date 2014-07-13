var https 		= require('https');
var mongoose	= require('mongoose');
var AuthToken 	= require('./models/auth_token');
var Trend 		= require('./models/trend');

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
						AuthToken.remove({}, function(err){});
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
				var closestOptions = {
					host: 'api.twitter.com',
					path: '/1.1/trends/closest.json?lat=' + lat + '&long=' + lon,
					port: 443,
					method: 'GET',
					headers: {
						'Authorization': 'Bearer ' + twitterAuthToken
					}
				};

				var req = https.request(closestOptions, function(res) {
					var responseData = '';

					res.on('data', function(chunk) {
						responseData += chunk;
					});

					res.on('end', function() {
						var body = JSON.parse(responseData);
						var woeid = body[0].woeid;

						console.log(woeid);

						if (woeid && woeid !== "") {
							var trendOptions = {
								host: 'api.twitter.com',
								path: '/1.1/trends/place.json?id=' + woeid,
								port: 443,
								method: 'GET',
								headers: {
									'Authorization': 'Bearer ' + twitterAuthToken
								}
							};
							
							console.log("updating twitter trends");
							var trendReq = https.request(trendOptions, function(res) {
								var trendResponseData = '';

								res.on('data', function(chunk) {
									trendResponseData += chunk;
								});

								res.on('end', function(){
									var body = JSON.parse(trendResponseData);
									var lastUpdated = body[0].as_of;
									var trends = body[0].trends;

									Trend.collection.remove({}, function(){});
									trends.forEach(function(trendEntry) {
										db_trend = new Trend();
										db_trend.source = "twitter";
										db_trend.trend = trendEntry.name;
										db_trend.lastupdated = lastUpdated;
										db_trend.save(function(err) {
											if (err) {
												console.log(err);
											}
										});
									});
								});
							});

							trendReq.end();
						}
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
