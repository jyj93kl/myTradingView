const { Console } = require('console');
var express = require('express')
  , http = require('http')
  , path = require('path');

var app = express();
var router = require('./routes/index.js')(app);
var fs = require('fs');

// express 서버 실행
var server = app.listen(3000, function () {
    console.log("Express server has started on port 3000");
});

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/coin/views');
app.set('view engine', 'ejs');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, '/coin/')));
app.engine('html', require('ejs').renderFile);
// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}


//////////////////////////소켓, DB 데이터전송/////////////////////

var io = require('socket.io').listen(server);

//////////////////////////////////////////////////////////////

var request = require('request');
let sharedObject = require("./coin/resources/modules/sharedObject.js").sharedObject;
let key = require("./storage/key.js");
let uuid = require("uuid");

//////////////////////////////////////////////////////////////
  
io.sockets.on('connection', function (socket) { // connection이 발생할 때 핸들러를 실행합니다.
	// console.log("socket on", socket);
	// console.log("socket on");
	socket.on("testCall", function(data){ socket.emit("testCall", "testCall")})
	socket.on(sharedObject.uuidv4, function(data){
		socket.emit(sharedObject.uuidv4, uuid.v4());
	});
	
	socket.on(sharedObject.selectMarkets, async function(data){ 
		sendResponse(socket, sharedObject.selectMarkets, data) 
	});
	socket.on(sharedObject.selectMarket, async function(data){ 
		sendResponse(socket, sharedObject.selectMarket, data)
	});
	socket.on(sharedObject.accounts, async function(data){ 
		sendResponse(socket, sharedObject.accounts, data)
	});
	// socket 통신 종료 후  DBConnection end
	socket.on('disconnect', function () {
		console.log('user disconnected');
	});
});

let sendResponse = function(socket, message, data){
	let request = JSON.parse(data);
	if(request.method == "GET"){
		getMethod(socket, message, request);
	} else {
		postMethod(socket, message, request);
	}
}
async function getMethod(socket, message, requestData){
	let sendCall = {
		method : "GET",
		url : requestData.callUrl,
		headers: {
			Authorization: key.createToken(requestData)
		}
	}
	await request(sendCall, function (err, res, result) {
		if(res.statusCode == 200){
			socket.emit(message, socketCallback(1, result));
		} else {
			socket.emit(message, socketCallback(-1, result));
		}
	});
}

async function postMethod(socket, message, requestData){
	let sendCall = {
		method : "POST",
		url : requestData.callUrl,
		headers: {
			Authorization: key.createToken(requestData)
		}
	}
	request(sendCall, function (err, res, result) {
		if(res.statusCode == 200){
			socket.emit(message, socketCallback(1, sendCall.url, result));
		} else {
			socket.emit(message, socketCallback(-1, sendCall.url, result));
		}
	});
}


let socketCallback = function(result, data){
	return JSON.stringify({ result : result, data : data })
}

// function testCall(callback) {
// 	var OPTIONS = {
// 		headers: {'Content-Type': 'application/json'},
// 		url: null,
// 		body: null
// 	};
// 	OPTIONS.url = upbit.selectMarkets;
// 	// request.setHeader("Content-Type", "application/json");
// 	request.get(OPTIONS, function (err, res, result) {
// 		statusCodeErrorHandler(res.statusCode, result, callback);
// 	});
// }
