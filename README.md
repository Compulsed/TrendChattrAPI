trendChattr-API
===============

RESTful API backend for trendChattr

Setup
=====

1. Install monogodb - http://www.mongodb.org/downloads
2. Install nodejs - http://nodejs.org/
3. Clone this repo - ```git clone https://github.com/rlgod/trendChattr-API.git && cd trendChattr-API```
4. Install node dependencies - ```npm install```
5. Run mongodb - ```mongod```
6. Run the API - ```node server.js```

API Endpoints
=============
All routes must start with ```http://<ip address>:8080/api/dev```
* ```/trends``` - Get the current trends
