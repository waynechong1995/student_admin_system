"use strict";
var express = require('express');
var app = express();
var bodyParser = require('body-parser');
require('./models');

app.use(bodyParser.urlencoded({limit: '50mb', extended: true }));
app.use(bodyParser.json({limit: '50mb'}));

app.all('/*', function(req, res, next) {
	res.setHeader('Access-Control-Allow-Origin', "*");
	res.setHeader('Access-Control-Allow-Credentials', true);
  	res.setHeader('Access-Control-Allow-Headers', "Origin, X-Requested-With, Content-Type, Accept");
  	res.setHeader('Access-Control-Allow-Methods','GET,PUT,POST,DELETE,OPTIONS');
  	next();
});

const router = express.Router();
require('./routes/admin-routes')(router);
app.use('/api',router);

app.get('/', function(req, res){
    res.json("Welcome to teacher administrative system");
    res.end();
});

var port = 8080;
app.listen(port, function(){
    console.log('listening on *:'+port);
});

module.exports = app;