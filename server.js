var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var app = express();
var serveStatic = require('serve-static');
var session = require('express-session');
var mysql = require('mysql');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var FileStore = require('session-file-store')(session);
var mongoClient = require('mongodb').MongoClient;
var assert = require('assert');

var url = 'mongodb://localhost:27017/test';

var connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: 'ASSwecan1995',
	database: 'twitter'
});
connection.connect(function(err){
	if(err){
		console.log(err)
	}
	else{
		console.log("connected to mysql");
	}
});

var mail = nodemailer.createTransport({
	//host: 'smtp.gmail.com',
	//port: 465,
	service: 'gmail',
	auth:{
		user: 'twittercse356@gmail.com',
		pass: 'cse356666'
	}
});

app.use(session({
	name: 'chicken',
	secret: 'no secret',
	saveUninitialized: true,
	resave: true
}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));
app.use(require('morgan')('dev'));

app.get('/', function(req,res){
	if(typeof req.session.user === 'undefined'){
		res.redirect('/login');
	}else{
		console.log('in here');
		console.log(req.session.user);
		res.sendFile('/index.html',{root: __dirname + '/public'});
	}
})

app.use('/',express.static(__dirname + '/public',{

}));

app.get('/adduser', function(req,res){
	res.sendFile('signUp.html',{root: __dirname+'/public'});
})
app.post('/adduser', function(req,res){
	var hash = crypto.createHash('md5').update(req.body.email).digest('hex');
	var post = {
		username : req.body.username,
		password : req.body.password,
		email : req.body.email,
		enabled : false,
		verify: hash
	};
	connection.query('INSERT INTO Users SET ?', post, function(err,result){
		if(err){
			res.send({
				status: "error",
				error: err
			});
		}
		else{
			var data ='<p><a href="http://127.0.0.1:9000/verify?email='+req.body.email+'&key='+hash+'">To activate your account</a></p>';
			mail.sendMail({
				from: 'Twitter <twittercse356@gmail.com>',
				to: req.body.email,
				subject: 'Your activation code',
				html: data
			}, function(error, response){
				if(error){
					console.log(error);
					res.send({
						status: "error",
						error: error
					});
				}else{
					res.send({
						status: "OK"
					})
				}
			})
		}
	})
		
})

app.get('/login', function(req,res){
	res.sendFile('login.html',{root: __dirname+'/public'});
})
app.post('/login', function(req,res){
	connection.query('SELECT * FROM Users WHERE Username = '+mysql.escape(req.body.username)
		+' AND password = '+mysql.escape(req.body.password), function(err, result){
			if(err){
				res.send({
					status: "error",
					error: err
				});
			}else{
				if(result.length===1){
					if(result[0].enabled === 0){
						res.send({
							status: "error",
							error: "Unactivated account!"
						})
					}else{
						req.session.user = req.body.username;
						var hour = 3600000;
						req.session.cookie.expires = new Date(Date.now()+hour);
						req.session.cookie.maxAge = hour;
						res.send({
							status: "OK"
						})
					}
					
				}
				else{
					res.send({
							status: "error",
							error: "Can not find account!"
						})
				}
			}
		})
})

app.post('/logout',function(req,res){
	if(typeof req.session.user != 'undefined'){
		req.session.destroy(function(err){
			if(err){
				res.send({
					status: "error",
					error: err
				});
			}else{
				res.send({
					status: "OK"
				})
			}
		})
	}else{
		res.send({
			status: "error",
			error: "You are not logged in as any user!"
		})
	}
})

app.get('/verify',function(req,res){
	if(req.query.key === 'abracadabra'){
		var query = connection.query('SELECT username FROM Users WHERE email = '+mysql.escape(req.query.email),function(err,result){
			if(err){
				res.send({
					status: "error",
					error: err
				});
			}
			else{
				if(result.length === 1){
					var query = connection.query('UPDATE Users SET enabled = true WHERE username = '+mysql.escape(result[0].username),function(err,result){
						if(err){
							res.send({
								status: "error",
								error: err
							});
						}else{
							res.send({
								status: "OK"
							});
						}
					})
				}
				else{
					res.send({
						status: "error",
						error: "Fail finding user!"
					})
				}
			}
		})
	}else{
		var query = connection.query('SELECT username FROM Users WHERE email = '+mysql.escape(req.query.email)
			+' AND verify = '+mysql.escape(req.query.key), function(err,result){
			if(err){
				res.send({
					status: "error",
					error: err
				});
			}
			else{
				if(result.length ===1){
					var query = connection.query('UPDATE Users SET enabled = true WHERE username = '+mysql.escape(result[0].username), function(err,result){
						if(err){
							res.send({
								status: "error",
								error: err
							});
						}else{
							res.send({
								status: "OK"
							});
						}
					})
				}else{
					res.send({
						status: "error",
						error: "Fail finding user!"
					});
				}
			}
		})
	}
})
app.post('/verify',function(req,res){
	if(req.body.key === 'abracadabra'){
		var query = connection.query('SELECT username FROM Users WHERE email = '+mysql.escape(req.body.email),function(err,result){
			if(err){
				res.send({
					status: "error",
					error: err
				});
			}
			else{
				if(result.length === 1){
					var query = connection.query('UPDATE Users SET enabled = true WHERE username = '+mysql.escape(result[0].username),function(err,result){
						if(err){
							res.send({
								status: "error",
								error: err
							});
						}else{
							res.send({
								status: "OK"
							});
						}
					})
				}
				else{
					res.send({
						status: "error",
						error: "Fail finding user!"
					})
				}
			}
		})
	}else{
		var query = connection.query('SELECT username FROM Users WHERE email = '+mysql.escape(req.body.email)
			+' AND verify = '+mysql.escape(req.body.key), function(err,result){
			if(err){
				res.send({
					status: "error",
					error: err
				});
			}
			else{
				if(result.length ===1){
					var query = connection.query('UPDATE Users SET enabled = true WHERE username = '+mysql.escape(result[0].username), function(err,result){
						if(err){
							res.send({
								status: "error",
								error: err
							});
						}else{
							res.send({
								status: "OK"
							});
						}
					})
				}else{
					res.send({
						status: "error",
						error: "Fail finding user!"
					});
				}
			}
		})
	}

})

app.post('/additem', function(req,res){

})

app.get('/item',function(req,res){

})

app.post('/search',function(req,res){

})

app.listen(9000, "127.0.0.1",function(){
	console.log("Server listening on port " + 9000);
})