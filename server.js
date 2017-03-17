var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var app = express();
var serveStatic = require('serve-static');

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(serveStatic(__dirname,{
	'index': ['/public/index.html']
}))
/*
app.get('*',function(req,res){
	console.log("Server function hit in server.js");
	res.sendFile(__dirname + '/public/index.html')
})

*/
app.get('*',function(req,res){
	console.log("SERVER FUNCTION HIT IN SERVERJS")
	res.sendFile(__dirname + '/public/index.html')
})

/*
app.use('/',express.static(__dirname + '/public',{

}));*/



app.listen(9000, "0.0.0.0",function(){
	console.log("Server listening on port " + 9000);
})