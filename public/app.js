var app = angular.module('app',['ui.router', 'ui.bootstrap', 'ngRoute']);


app.config(["$routeProvider", "$locationProvider", function($routeProvider, $locationProvider){
    $routeProvider
	.when("/", {
		templateUrl: "index.html",
		controller: "mainCtrl"
	})
	.when("/login", {
		templateUrl: "login.html",
		controller: "loginCtrl"
	})
    .when("/adduser",{
      templateUrl: "signUp.html",
      controller: "adduserCtrl"
    });
}]);
/*
app.config(['$urlRouterProvider','$stateProvider'],function($urlRouterProvider,$stateProvider){
	$urlRouterProvider.otherwise('/');

	$stateProvider
		.state('home',{
			url:'/',
			templateUrl:'partials/login.html'
		})

});*/




app.controller("mainCtrl",function($scope,$location,$http){

	//$http.get('/getAllTweets').success(function(res){
	//	$scope.tweets = res;
	//})
	$scope.getItem = function(){
		query = '/item/'+$scope.tweetId;
		var result = [];
		$http.get(query).success(function(res){
			result.push(res.item);
			$scope.tweets = result;

		})
	}
	$scope.searchTweets = function(){
		var time, lim;
		if($scope.searchTweet ===""){
			$scope.searchTweet = null;
		}
		if($scope.limit ===""){
			$scope.limit = null;
		}
		if(!angular.isUndefined($scope.searchTweet)){
			time = parseInt($scope.searchTweet);
		}

		var jsonPost = {
			timestamp: time,
			limit: $scope.searchLimit
		}
		console.log(jsonPost);
		$http.post('/search',jsonPost).success(function(res){
			console.log(res);
			$scope.tweets = res.items;
		})
	}

	$scope.logout = function(){
		$http.post('/logout').success(function(res){
			if(res.status === "OK"){
				window.location.href = "/";
			}

		})
	}

	$scope.deleteTweet = function(){
		console.log("DELETE TWEET CALLED")
		var query = '/item/' + $scope.deleteTweetId;
		$http.delete(query).success(function(res){
			if(res.status == "OK"){
				alert("TWEET DELETED");
			}
		})
	}

	$scope.additem = function(){
			var jsonToPost = {
			content: $scope.tweet,
			parent: 'none'
		};

		$http.post('/additem',jsonToPost).success(function(res){
			if(res.status === "OK"){
			 alert("Tweet id: "+res.id+ "was posted");
			}
			else{
				alert("Fail");
			}
			//console.log(res);
		})
	}

	$scope.follow = function(){
		var jsonToPost = {
			username: $scope.userToFollow,
			follow: true
		}

		$http.post('/follow',jsonToPost).success(function(res){
			if (res.status === "OK"){
				alert("FOLLOWED");
			}
			else{
				alert("Fail");
			}
		})
	}
})

app.controller("loginCtrl",function($scope,$location,$http,$uibModal){

	$scope.login = function(){
		var data  = {
			username : $scope.login.username,
			password : $scope.login.password
		}

		$http.post('/login', data).success(function(res){
			if(res.status ==="OK"){
				window.location.href = "/";
			}
			else{
				console.log(res)
				$scope.loginInfo = "Fail to login";
			}
		})
	}

	$scope.signUpButton = function(){
		    var modalInstance = $uibModal.open({
            templateUrl: '/adduser',
            controller: 'adduserCtrl'
        });

	}
})

app.controller("adduserCtrl",function($scope,$location,$http, $uibModalInstance){
	$scope.ok = function(){
		var data = {
			username : $scope.adduser.username,
			password : $scope.adduser.password,
			email : $scope.adduser.email
		}
		$http.post('/adduser',data).success(function(res){
			if(res.status ==="OK"){
				console.log(res)
				$scope.adduserInfo = "Please verify your account"
			}else{
				console.log(res)
				
				$scope.adduserInfo = "Fail to signup"
			}
		})
	}

	$scope.cancel = function(){
		$uibModalInstance.close();
	}
})
