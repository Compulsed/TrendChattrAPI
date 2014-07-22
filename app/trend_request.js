var https 		= require('https');
var mongoose	= require('mongoose');
var moment		= require('moment');
var AuthToken 	= require('./models/auth_token');
var Chatroom 		= require('./models/chatroom');

//===================================
//	Twitter Auth Credentials
//===================================
var twitterConsumerKey = encodeURIComponent("FkYMquZ0aRz2tiQgQ6RkwRta0");
var twitterConsumerSecret = encodeURIComponent("K0SgrvidjSEHEdhr8KOJhFd2MPsh5bPMakLkJu9OErdOcfOhwr");

var twitterBearerCredentials = twitterConsumerKey + ":" + twitterConsumerSecret;
var twitterBase64Credentials = new Buffer(twitterBearerCredentials).toString('base64');

var lastGlobalUpdate = moment(0); // Initialise to epoch

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

// Get the current location trends from twitter 
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

									trends.forEach(function(trendEntry) {
										db_trend = new Chatroom();
										db_trend.source = "twitter";
										db_trend._id = trendEntry.name;
										db_trend.lastupdated = lastUpdated;
										db_trend.save(function(err){
											if (err)
												console.log(err);
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

function twitterTrendsGlobal() {
	if (moment().diff(lastGlobalUpdate,'minutes') >= 5){
		lastGlobalUpdate = moment();
		getToken("twitter", function(err, twitterAuthToken) {
		if (err) {
			console.log(err);
		} else {
			if (twitterAuthToken === "" || !twitterAuthToken){
				console.log("twitterAuthToken is empty");
			} else {
				console.log("updating global trends");
				// Get global trends
				var trendGlobalOptions = {
					host: 'api.twitter.com',
					path: '/1.1/trends/place.json?id=1',
					port: 443,
					method: 'GET',
					headers: {
						'Authorization': 'Bearer ' + twitterAuthToken
					}
				};

				var trendReq = https.request(trendGlobalOptions, function(res) {
					var trendResponseData = '';

					res.on('data', function(chunk) {
						trendResponseData += chunk;
					});

					res.on('end', function(){
						var body = JSON.parse(trendResponseData);
						var lastUpdated = body[0].as_of;
						var trends = body[0].trends;

						trends.forEach(function(trendEntry) {
							Trend.find({ trend: trendEntry.name }, function(err, docs) {
								if (err) {
									console.log(err);
								} else {
									if (docs.length === 0) {
										db_trend = new Chatroom();
										db_trend.source = "twitter";
										db_trend._id = trendEntry.name;
										db_trend.lastupdated = lastUpdated;
										db_trend.save(function(err){
											if (err)
												console.log(err);
										});
									}
								}
							});
						});
					});
				});

				trendReq.end();
				}
			}
		});
	}
}

module.exports.twitterLocation = function (lat, lon){
	twitterAuthenticate();
	twitterTrends(lat, lon);
};

module.exports.twitterGlobal = function(){
	twitterAuthenticate();
	twitterTrendsGlobal();
}
