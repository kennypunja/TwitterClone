var express = require('express');
var bodyParser = require('body-parser');
var fs = require('fs');
var app = express();
var serveStatic = require('serve-static');
var session = require('cookie-session');
var mysql = require('mysql');
var crypto = require('crypto');
var nodemailer = require('nodemailer');
var mongoClient = require('mongodb').MongoClient;
var assert = require('assert');
var cryptoRandomString = require('crypto-random-string');

const dateTime = Date.now();

//var url = 'mongodb://52.90.176.234:27017/twitter';
var url = 'mongodb://localhost:27017/twitter';



/*
mongoClient.open(function(err,mongoClient){
	var twitterDb = mongoClient.db("twitter");
})
*/
/*
var connection = mysql.createConnection({
	host: '34.207.92.80',
	user: 'root',
	password: 'cse356',
	database: 'Twitter'
});*/

var connection = mysql.createConnection({
	host: '52.14.213.18',
	user: 'root',
	password: 'cse356',
	database: 'Twitter'
});

/*
var connection = mysql.createConnection({
	host: 'localhost',
	user: 'root',
	password: 'root',
	database: 'twitter'
})*/


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
app.use(require('morgan')('dev'));


var db;

mongoClient.connect(url,function(err,database){
	assert.equal(null,err);
	console.log("CONNECTION SUCCESS TO MONGO");
	db = database;
	app.listen(8080,"0.0.0.0",function(){
	console.log("server listening on port " + 8080);
		})
	//db.tweets.createIndex({"content": "text"});
})



app.get('/', function(req,res){
	if(typeof req.session.user === 'undefined'){
		res.redirect('/login');
	}else{
		//console.log('in here');
		//console.log(req.session.user);
		res.sendFile('/index.html',{root: __dirname + '/public'});
	}
})

app.get('/profile',function(req,res){
	res.sendFile('profile.html',{root: __dirname+'/public'});

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
	db.collection('users').insertOne(post,function(err,result){
		if (err){
			var resToSend = {
				status: "error",
				error: err
			}
		}
		var resultToSend = {
			status: "OK"
		}
		res.send(resultToSend)
	})
		
})

app.get('/login', function(req,res){
	res.sendFile('login.html',{root: __dirname+'/public'});
})
app.post('/login', function(req,res){

	var query = {
		username: req.body.username,
		password: req.body.password
	}

	db.collection('users').findOne(query,function(err,result){
		if (err){
			res.send({
				status:"error",
				error: err
			})
		}
		else{
			console.log(result);
			if (result == null){
				res.send({
					status: "error",
					error: "Can not find account!"
				})
			}
			if(result.enabled === 0){
				res.send({
					status:"error",
					error:"Unactivated account!"
				})
			}else{
				req.session.user = result.username;
				res.send({
					status:"OK"
				})
			}
		}
	})

})

app.post('/logout',function(req,res){
	if(typeof req.session.user != 'undefined'){
		req.session = null;
		res.send({status: "OK"});
	}else{
		res.send({
			status: "error",
			error: "You are not logged in as any user!"
		})
	}
})

app.get('/verify',function(req,res){

	if(req.query.key === 'abracadabra'){
		var query = {
			email: req.body.email
		}
		db.collection('users').findOne(query,function(err,result){
			if(err){
				res.send({
					status:"error",
					error:err
				})
			}
			else{

				db.collection('users').update({"username": result.username},{$set:{'enabled':true}},function(err,result2){
					if(err){
						res.send({
							status:"error",
							error: err
						})
					}
					else{
						res.send({
							status: "OK"
						})
					}
				}
				else{
					status: "error",
					error: "Fail finding user!"
				}
			}
		})
	}
	else{
		var query = {
			email: req.body.email,
			verify: req.body.key
		}
		db.collection('users').findOne(query,function(err,result){
			if(err){
				res.send({
					status:"error",
					error:err
				})
			}
			else{
				if(result){
					db.collection('users').update({"username": result.username},{$set:{'enabled':true}},function(err,result2){
						if(err){
							res.send({
								status:"error",
								error:err
							})
						}
						else{
							res.send({status:"OK"});
						}

					})
				}
				else{
					res.send({
						status:"error",
						error:"Fail finding user!"
					})
				}
			}
		})
	}
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
								status: "OK",

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
	
	/*if(typeof req.session.user == 'undefined'){
		res.send({
			status: "error",
			error: "You are not logged in as any user!"
		})
	}
	*/

	var postid = crypto.createHash('md5').update(req.body.content+cryptoRandomString(10)).digest('hex');

	var timestamp = Math.floor(dateTime/1000);
	var newDoc = {
		content: req.body.content,
		parent: req.body.parent,
		username: null,
		timestamp: timestamp,
		LikeCounter : 0,
		RTCounter : 0,
		parent : req.body.id,
		id: postid
	}
	db.collection('tweets').insertOne(newDoc,function(err,result){
		assert.equal(null,err);
		var resultToSend = {
			status: "OK",
			id: postid
		}
		res.send(resultToSend)

	})
	
})

app.get('/item/:id',function(req,res){
	var queryJson = {
		id: req.params.id
	}
	db.collection('tweets').findOne(queryJson,function(err,result){	
		if (err){
			res.send({
				status: "error"
			})
		}
		if(result){
			var resultToRespond = {
			status: "OK",
			item: {
				id: result.id,
				username: result.username,
				content: result.content,
				timestamp: result.timestamp
			}
		}
		res.send(resultToRespond);
		}
		if(!result){
			res.send({
				status: "error"
			})
		}
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
	var q = req.body.q;
	var following = req.body.following;
	var username = req.body.username;
	var parent
	if(req.body.hasOwnProperty('parent')){
		 parent= req.body.parent;
	}else{
		parent = null;
	}

	var query;
if (q != null){
	if(req.body.username != null){
		query = {
			$text:{
				$search:q
			},
			username:req.body.username,
			timestamp:{
				$lte:newStamp
			}
		}
	}
	else{
		query ={
			$text:{
				$search:q
			},
			timestamp:{
				$lte:newStamp
			}
		}
	}	
}
else{
	if(req.body.username != null){
		query = {
			username:req.body.username,
			timestamp:{
				$lte:newStamp
			}
		}
	}
	else{
		query ={
			timestamp:{
				$lte:newStamp
			}
		}
	}	
}		
/* =-=-=-==--=-=-=-=-======================================================= */

	if (q != null && following == true && username == null && parent == null && (replies == false || replies == null)){
		query ={
			$text:{
				$search:q
			},
			timestamp:{
				$lte:newStamp
			}
		}
	}
	if (q != null && following == true && username == null && parent == null && replies == true){
		// db.tweets.find({$text:{$search:"wutsup"},parent:{$ne:null}});
		//of all users that we are following as well
		query ={
			$text:{
				$search:q
			},
			timestamp:{
				$lte:newStamp
			},
			parent:{$ne:null}
		}
	}
	if (q != null && following == true && username == null && parent != null){

		//select only from following need to add
		query = {
			$text:{
				$search:q
			},
			timestamp:{
				$lte:newStamp
			},
			parent:parent
		}
	}
	if(q != null && following ==false && username != null && parent == null && (replies == false || replies == null)){
		query = {
			$text:{
				$search:q
			},
			timestamp:{
				$lte:newStamp
			},
			username:username
		}
	}

	if (q != null && following == false && username != null && parent == null && replies == true){
		// db.tweets.find({$text:{$search:"wutsup"},parent:{$ne:null}});

		query = {
			$text:{
				$search:q
			},
			timestamp:{
				$lte:newStamp
			},
			username:username,
			parent:{$ne:null}
		}
	}
	if(q != null && following == false && username != null && parent != null){
		query = {
			$text:{
				$search:q
			},
			timestamp:{
				$lte:newStamp
			},
			username:username,
			parent:parent
		}
	}
	if(q != null && following ==false && username == null && parent == null && (replies == false || replies == null)){
		query = {
			$text:{
				$search:q
			},
			timestamp:{
				$lte:newStamp
			}
		}
	}
	if(q != null && following == false && username == null && parent == null && replies == true){
		query = {
			$text:{
				$search:q
			},
			timestamp:{
				$lte:newStamp
			},
			parent:{$ne:null}
		}
	}
	if (q != null && following == false && username == null && parent != null){
		query = {
			$text:{
				$search:q
			},
			timestamp:{
				$lte:newStamp
			},
			parent:parent
		}
	}
	else if(q == null && following != null && username != null){
			res.send({
				status: "OK",
				items: []
		})
	}

	else if(q == null && following == true && username == null && parent == null && (replies == false || replies == null)){
		//need to get following users, and query for all tweets made by followings
		query = {

		}
	}
	else if (q == null && following == true && username == null && parent == null && replies == true){
		// need to get following users and then query

		query = {
			timestamp:{
				$lte:newStamp
			},
			parent:{$ne:null}
		}
	}
	else if(q == null && following == true && username == null && parent != null){
		//need to get following users and then query

		query = {
			timestamp:{
				$lte:newStamp
			},
			parent:parent
		}
	}
	else if(q == null && following == false && username != null && parent == null && (replies == false || replies == null)){
		query = {
			timestamp:{
				$lte:newStamp
			},
			username:username
		}
	}
	else if (q == null && following == false && username != null && parent == null && replies == true){
			query = {
				timestamp:{
					$lte:newStamp
				},
				username:username,
				parent:{$ne:null}
			}
	}
	else if (q == null && following == false && username != null && parent != null){
		query = {
			timestamp:{
				$lte:newStamp
			},
			username:username,
			parent: parent
		}
	}
	else if(q == null && following ==false && username == null && parent == null && (replies == false || replies == null)){
		query = {
			timestamp:{
				$lte:newStamp
			}
		}
	}
	else if (q == null && following == false && username == null && parent == null && replies == true){
		query = {
			timestamp:{
				$lte:newStamp
			},
			parent:{$ne:null}
		}
	}
	else if(q == null && following == false && username == null && parent != null){
		query = {
			timestamp:{
				$lte:newStamp
			},
			parent:parent
		}
	}
	else{
		if(q != null && following == true && username != null){
			res.send({
				status: "OK",
				items: []
			})
		}
		else if(q != null && following == true && username == null && parent == null && (replies == false || replies == null)){
			//following is true NEED TO GET FOLLOWING!!
			query = {
				$text:{
					$search:q
				},
				timestamp:{
					$lte:newStamp
				}
			}
		}
		else if (q != null && following == true && username == null && parent == null && replies == true){
			//following is true need to get following!!
			query = {
				$text:{
					$search:q
				},
				timestamp:{
					$lte:newStamp
				},
				parent:{$ne:null}
			}
		}
		else if(q != null && following == true && username == null && parent != null){
			//following is true@!@!@!
			query = {
				$text:{
					$search:q
				},
				timestamp:{
					$lte:newStamp
				},
				parent:parent
			}
		}
		else if(q != null && following ==false && username != null && parent == null  && (replies == false || replies == null)){
			query = {
				$text:{
					$search:q
				},
				timestamp:{
					$lte:newStamp
				},
				username:username
			}
		}
		else if (q != null && following == false && username != null && parent == null && replies == true){
			query = {
				$text:{
					$search:q
				},
				timestamp:{
					$lte:newStamp
				},
				username:username,
				parent:{$ne:null}
			}
		}
		else if (q != null && following == false && username != null && parent != null){
			query = {
				$text:{
					$search:q
				},
				timestamp:{
					$lte:newStamp
				},
				username:username,
				parent:parent
			}
		}
		else if(q != null && following ==false && username == null && parent == null  && (replies == false || replies == null)){
			query = {
				$text:{
					$search:q
				},
				timestamp:{
					$lte:newStamp
				},
			}
		}
		else if(q != null && following == false && username == null && parent == null && replies == true){
			query = {
				$text:{
					$search:q
				},
				timestamp:{
					$lte:newStamp
				},
				parent:{$ne:null}
			}
		}
		else if(q != null && following == false && username == null && parent != null){
			query = {
				$text:{
					$search:q
				},
				timestamp:{
					$lte:newStamp
				},
				parent:parent
			}
		}
		else if(q == null && following != null && username != null){
			res.send({
				status: "OK",
				items: []
			})
		}
		else if(q == null && following == true && username == null && parent == null && (replies == false || replies == null)){
			//following is TRUE need to fix
			query = {
				timestamp:{
					$lte:newStamp
				}
			}
		}
		else if (q == null && following == true && username == null && parent == null && replies == true){
			//following is true
			query = {
				timestamp:{
					$lte:newStamp
				},
				parent:{$ne:null}
			}
		}
		else if (q == null && following == true && username == null && parent != null){
			//following is true!!!!
			query = {
				timestamp:{
					$lte:newStamp
				},
				parent:parent
			}
		}
		else if(q == null && following == false && username != null && parent == null && (replies == false || replies == null)){
			query = {
				timestamp:{
					$lte:newStamp
				},
				username:username
			}
		}
		else if (q == null && following == false && username != null && parent == null && replies == true){
			query = {
				timestamp:{
					$lte:newStamp
				},
				username:username,
				parent:{$ne:null}
			}
		}
		else if(q == null && following == false && username != null && parent != null){
			query = {
				timestamp:{
					$lte:newStamp
				},
				username:username,
				parent:parent
			}
		}
		else if(q == null && following ==false && username == null && parent == null && (replies == false || replies == null)){
			query = {
				timestamp:{
					$lte:newStamp
				}
			}
		}
		else if (q == null && following == false && username == null && parent == null && replies == true){
			query = {
				timestamp:{
					$lte:newStamp
				},
				parent:{$ne:null}
			}
		}
		else if(q == null && following == false && username == null && parent != null){
			query = {
				timeestamp:{
					$lte:newStamp
				},
				parent:parent
			}
		}
	}



///////=-=-=-=--=-=-=-=-=-=-=-=-=-=-=-=-============================================================================================
	if (req.body.limit != null && req.body.limit != ""){
		if(q != null && following == true && username != null){
			res.send({
				status: "OK",
				items: []
			})
		}
		else if (q != null && following == true && username == null){

		}
		db.collection('tweets').find(query).sort({timestamp:-1}).limit(Number(req.body.limit)).toArray(function(err,doc){
			if(err){
				console.log(err)
			}
			else{
				if (doc != null){
					console.log(doc);
					if(req.body.following == true){
						connection.query('SELECT User2 From Following where User1 =' + mysql.escape(req.session.user) + ';',function(err,result){
							if(err){
								console.log(err)
							}
							else{
								var newList = [];
								var string = JSON.stringify(result);
								var jsonArrayOfFollowing = JSON.parse(string);
								var parsingJsonArray = [];
								for (var k = 0; k<= jsonArrayOfFollowing.length;k++){
									if (k==jsonArrayOfFollowing.length){
										for(var j = 0; j<=doc.length; j++){
											if(j==doc.length){
												var toReturn = {
													status:"OK",
													items: newList
												}
												res.send(toReturn);
											}
											else{
												if(parsingJsonArray.indexOf(doc[j].username)>= 0){
													newList.push(doc[j])
												}
											}
										}
									}
									else{
										parsingJsonArray.push(jsonArrayOfFollowing[k].User2)
									}
								}
							}
						})
					}
					else{
						var response = {
							status:"OK",
							items: doc
						}
						res.send(response)
					}				
				}
			}
		})
	}
	else{
		db.collection('tweets').find(query).sort({timestamp:-1}).limit(25).toArray(function(err,doc){
			if(err){
				console.log(err)
			}
			else{
				if (doc != null){
					console.log(doc);
					if(req.body.following == true){
						connection.query('SELECT User2 From Following where User1 =' + mysql.escape(req.session.user) + ';',function(err,result){
							if(err){
								console.log(err)
							}
							else{
								var newList = [];
								var string = JSON.stringify(result);
								var jsonArrayOfFollowing = JSON.parse(string);
								var parsingJsonArray = [];
								for (var k = 0; k<= jsonArrayOfFollowing.length;k++){
									if (k==jsonArrayOfFollowing.length){
										for(var j = 0; j<=doc.length; j++){
											if(j==doc.length){
												var toReturn = {
													status:"OK",
													items: newList
												}
												res.send(toReturn);
											}
											else{
												if(parsingJsonArray.indexOf(doc[j].username)>= 0){
													newList.push(doc[j])
												}
											}
										}
									}
									else{
										parsingJsonArray.push(jsonArrayOfFollowing[k].User2)
									}
								}
							}
						})
					}
					else{
						var response = {
							status:"OK",
							items: doc
						}
						res.send(response)
					}				
				}
			}
		})
	}
})

app.delete('/item/:id',function(req,res){
	//console.log(req.params.id);
	//var id = require('mongodb').ObjectId(req.params.id);
	var id = req.params.id;
	db.collection('tweets').remove({"id": id},function(err,doc){
		if (err){
			res.send({
				status : "error"
			});
		}
		else{
			res.send({
				status : "OK"
			})
		}
	})
})

app.get('/user/:username',function(req,res){
	var email, follower, following;
	connection.query('SELECT email FROM Users WHERE username = '+mysql.escape(req.params.username), function(err,result){
		if(err){
			res.send({
					status: "error",
					error: err
			})
		}else{
			email = result[0].email;
			connection.query('SELECT COUNT(User2) AS Following FROM Following WHERE User1 = '+ mysql.escape(req.params.username), function(err, result){
				if(err){
					res.send({
					status: "error",
					error: err
				})
				}else{
					following = result[0].Following;
					connection.query('SELECT COUNT(User1) AS Follower FROM Following WHERE User2 = '+ mysql.escape(req.params.username), function(err, result){
						if(err){
							res.send({
					status: "error",
					error: err
				})
						}else{
							follower = result[0].Follower;
							var response = {
								email : email,
								followers : follower,
								following : following
							}
							//console.log(response);
							res.send({
								status : "OK",
								user: response
							})
						}
					})
				}
			})
		}
	})
})

app.get('/user/:username/followers',function(req,res){
	//console.log(req.params.username)
	if(req.body.limit != null && req.body.limit != ""){
		connection.query('SELECT User1 From Following where User2 =' + mysql.escape(req.params.username) + ' LIMIT ' + mysql.escape(req.body.limit) + ';',function(err,result){
			if(err){
				console.log(err);
			}
			else{
				//console.log(result)
				res.send({status:"OK"});
			}
		})
	}
	else{
		connection.query('SELECT User1 From Following where User2 =' + mysql.escape(req.params.username) + ' LIMIT 50;',function(err,result){
			if(err){
				console.log(err);
			}
			else{
				var response = {
					status: "OK",
					users: result
				}
				res.send(response);
			}
		})
	}
})

app.get('/user/:username/following',function(req,res){
	//console.log(req.params.username)
	if(req.body.limit != null && req.body.limit != ""){
		connection.query('SELECT User2 From Following where User1 =' + req.params.username + ' LIMIT ' + req.body.limit + ';',function(err,result){
			if(err){
				console.log(err);
			}
			else{
				//console.log(result)
				res.send({status:"OK"});
			}
		})
	}
	else{
		connection.query('SELECT User2 From Following where User1 =' + mysql.escape(req.params.username) + ' LIMIT 50;',function(err,result){
			if(err){
				console.log(err);
			}
			else{
				var response = {
					status: "OK",
					users: result
				}
				res.send(response);
			}
		})
	}
})



app.post('/follow',function(req,res){
	//console.log(req.body);
	if(req.body.follow == true){
		//console.log("TRUE???")
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
		//console.log("FOLLOW IS NOT TRUE");
		connection.query('DELETE FROM Following WHERE User1 = '+mysql.escape(req.session.user) +' AND User2 = '+ mysql.escape(req.body.username), function(err,result){
			if(err){
				res.send({
				status: "error",
				error: err
			});
			}else{
				console.log(req.session.user +'has unfollow '+req.body.username);
				res.send({status: "OK"});
			}
		})
	}
})


app.post('/item/:id/like',function(req,res){
	if(req.body.like == true){
		console.log(req.params.id);
			db.collection('tweets').update({"id": req.params.id},{$inc:{'LikeCounter':1}},function(err,result){
			if (err){
				console.log(err);
				res.send({status:"error"})
			}
			var jsonToSend = {
				status: "OK"
			}
			console.log(result);
			res.send(jsonToSend);
		})
	}
else if(req.body.like == false){
		console.log("in false");

		db.collection('tweets').update({"id": req.params.id},{$inc:{'LikeCounter':-1}},function(err,result){
			if (err){
				console.log(err);
				res.send({status:"error"})
			}
			var jsonToSend = {
				status: "OK"
			}
			console.log(result);
			res.send(jsonToSend);
		})
	}
else{
	res.send("??");
}
})



/*
app.listen(8080, "172.31.64.118",function(){
	console.log("Server listening on port " + 9000);
})*/


