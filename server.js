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
const dateTime = Date.now();

var url = 'mongodb://localhost:27017/twitter';

var connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: 'root',
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
mongoClient.connect(url,function(err,db){
	assert.equal(null,err);
	console.log(req.body);
	var timestamp = Math.floor(dateTime/1000);
	var newDoc = {
		content: req.body.content,
		parent: req.body.parent,
		username: req.session.user,
		timestamp: timestamp
	}
	db.collection('tweets').insertOne(newDoc,function(err,result){
		assert.equal(null,err);
		db.close();
		var resultToSend = {
			status: "OK",
			id: newDoc._id,
		}
		res.send(resultToSend);
	})
})
})

app.get('/item/:id',function(req,res){
mongoClient.connect(url,function(err,db){
	assert.equal(null,err);
	//console.log(req.query.id)
	console.log("THIS IS ID");
	console.log(req.params.id)
	var id = require('mongodb').ObjectId(req.params.id);
	var queryJson = {
		_id: id
	}


	db.collection('tweets').findOne(queryJson,function(err,result){
		if (err){
			res.send({
				status: "error"
			})
		}
		console.log("THIS IS RESULT");
		console.log(result);
		db.close();
		var resultToRespond = {
			status: "OK",
			item: {
				id: result._id,
				username: result.username,
				content: result.content,
				timestamp: result.timestamp
			}
		}
		res.send(resultToRespond);
	})
})
})

app.get('/getAllTweets',function(req,res){
	mongoClient.connect(url,function(err,db){
		assert.equal(null,err);

		db.collection('tweets').find().toArray(function(err,doc){
			res.send(doc);
			db.close();
		})
	})
})

app.post('/searchTweets',function(req,res){
	var newStamp = Number(req.body.timestamp);
	console.log("this is time stamp" + newStamp)
		mongoClient.connect(url,function(err,db){
		assert.equal(null,err);
		var query = {
			timestamp: {
				$lte:newStamp 
			}
		}
		db.collection('tweets').find(query).toArray(function(err,doc){
			if (doc != null){
				res.send(doc)
				console.log(doc)
				db.close();
			}
		})

	})
})

app.post('/search',function(req,res){
	var newStamp = req.body.timestamp;
	console.log("THIS IS TIME STAMP " + newStamp);
	var limit = Number(req.body.limit);
	console.log("THIS IS LIMIt" + limit)
	mongoClient.connect(url,function(err,db){
		assert.equal(null,err);
		var query = {
			timestamp: {
				$lte:newStamp 
			}
		}


		var options = {
			limit: limit
		}

		db.collection('tweets').find(query).limit(limit).toArray(function(err,doc){
			if (doc != null){
				var response = {
					status: "OK",
					items: doc,
				}
				res.send(response)
				db.close();
			}
		})

	})
})

app.listen(9000, "127.0.0.1",function(){
	console.log("Server listening on port " + 9000);
})