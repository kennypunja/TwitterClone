var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var app = express();
var serveStatic = require('serve-static');
var session = require('cookie-session');
var mysql = require('mysql');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
//var FileStore = require('session-file-store')(session);
var mongoClient = require('mongodb').MongoClient;
var assert = require('assert');
const dateTime = Date.now();

//var url = 'mongodb://52.90.176.234:27017/twitter';
var url = 'mongodb://localhost:27017/twitter';



mongoClient.connect(url,function(err,db){
	assert.equal(null,err);
	console.log("CONNECTION SUCCESS");
	//db.tweets.createIndex({"content": "text"});
	})

/*
var connection = mysql.createConnection({
	host: '52.54.224.209',
	user: 'root',
	password: 'cse356',
	database: 'Twitter'
});
*/

var connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: 'root',
	database: 'twitter'
})

connection.connect(function(err){
	if(err){
		console.log(err);
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
	resave: false,
	maxAge: 24 * 60 * 60 * 1000

}));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({
	extended: true
}));
//app.use(require('morgan')('dev'));

app.get('/', function(req,res){
	if(typeof req.session.user === 'undefined'){
		res.redirect('/login');
	}else{
		//console.log('in here');
		//console.log(req.session.user);
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
			res.send({status: "OK"});
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
	if(typeof req.session.user == 'undefined'){
		res.send({
			status: "error",
			error: "You are not logged in as any user!"
		})
	}
	else{
		mongoClient.connect(url,function(err,db){
	assert.equal(null,err);
	//console.log(req.body);
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
	}

})

app.get('/item/:id',function(req,res){
mongoClient.connect(url,function(err,db){
	assert.equal(null,err);
	//console.log(req.query.id)
	//console.log("THIS IS ID");
	//console.log(req.params.id)
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
		//console.log("THIS IS RESULT");
		//console.log(result);
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
	//console.log("this is time stamp" + newStamp)
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
				//console.log(doc)
				db.close();
			}
		})

	})
})

app.post('/search',function(req,res){
	var newStamp = req.body.timestamp || dateTime;
	console.log(req.body);
	//var limit = Number(req.body.limit) || 25;
	//console.log("THIS IS LIMIt" + limit)
	var query;

	var q = req.body.q;

	/*
	THIS CODE WORKS BUT IM JUST COMMENTING IT OUT TO ONLY TEST OUT THE SEARCH. BUT ALSO THE IFS ARE WEIRD. NEED BETTER WAY oF HANdLIng
	if(req.body.timestamp != null){
		if (req.body.usernameSearch != null){
		query = {
			timestamp : {
				$lte : req.body.timestamp
			},
			username : req.body.usernameSearch
		}
	}
	else{
		query = {
			timestamp : {
				$lte : req.body.timestamp
			}
		}
	}
}
	else{
		if (req.body.usernameSearch != null){
		query = {
			timestamp : {
				$lte : dateTime
			},
			username : req.body.usernameSearch
		}
	}
	else{
		query = { 
			timestamp : {
				$lte: dateTime
			}
		}
	}
}*/

	/*var query = {
		$text:{
			$search: q
		},
		$score:{
			$meta: "textScore"
		}
	}*/

	/*var query = {
		$text: {$search: q }
		}
		, {score: 
		{$meta: 'textScore'}

		{$text:{$search:q}},{score:{$meta:"textScore"}
	};*/

	

	mongoClient.connect(url,function(err,db){
		assert.equal(null,err);
		
	if (req.body.limit != null && req.body.limit != ""){

		db.collection('tweets').find(query).sort({score:{$meta:"textScore"}}).limit(Number(req.body.limit)).toArray(function(err,doc){
			if (doc != null){
				var list = [];
				for (var i = 0; i<=doc.length; i++){
					if (i == doc.length){
						var response = {
							status: "OK",
							items: list,
						}
						res.send(response)
						db.close()
					}
					else{
						var json = {
						content: doc[i].content,
						parent: doc[i].parent,
						username: doc[i].username,
						timestamp: doc[i].timestamp,
						id: doc[i]._id
						}
						list.push(json);
					}
					
				}
			}
		})
	}
	else{
		db.collection('tweets').find({$text:{$search:q}},{score:{$meta:"textScore"}}).sort({score:{$meta:"textScore"}}).limit(25).toArray(function(err,doc){
			if(err){
				console.log(err)
			}
			if (doc != null){
				//console.log("found something "+doc.length);
				var list = [];
				for (var i = 0; i<=doc.length; i++){
					if (i == doc.length){
						var response = {
							status: "OK",
							items: list,
						}
						//console.log(response.items);
						res.send(response)
						console.log(response);
						db.close()
					}
					else{
						var json = {
						content: doc[i].content,
						parent: doc[i].parent,
						username: doc[i].username,
						timestamp: doc[i].timestamp,
						id: doc[i]._id
						}
						list.push(json);
					}
					
				}
			}
		})
	}
	})
})

app.delete('/item/:id',function(req,res){
	console.log(req.params.id);
	var id = require('mongodb').ObjectId(req.params.id);
	mongoClient.connect(url,function(err,db){
	assert.equal(null,err);
	db.collection('tweets').remove({'_id': id},function(err,doc){
		if (err){
			console.log(err)
			res.send("Failure");
		}
		else{
			console.log("TWEET DELETED");
			res.send("Success")
		}
	})
})
})

app.post('/follow',function(req,res){
	console.log(req.body);
	if(req.body.follow == true){
		console.log("TRUE???")
		connection.query('INSERT INTO Following VALUES('+ mysql.escape(req.session.user) + ',' + mysql.escape(req.body.username) + ')', function(err,result){
		if(err){
			console.log(err);
			res.send({
				status: "error",
				error: err
			});
		}
		else{
			res.send({status: "OK"});
		}
	})
	}
	else{
		console.log("FOLLOW IS NOT TRUE");
	}
})
/*
app.listen(8080, "172.31.64.118",function(){
	console.log("Server listening on port " + 9000);
})*/

app.listen(9000,"0.0.0.0",function(){
	console.log("server listening on port " + 9000);
})
