var app = angular.module('app',['ui.router', 'ui.bootstrap']);

/*
app.config(['$urlRouterProvider','$stateProvider'],function($urlRouterProvider,$stateProvider){
	$urlRouterProvider.otherwise('/');

	$stateProvider
		.state('home',{
			url:'/',
			templateUrl:'partials/login.html'
		})

});*/




app.controller("MainController",function($scope,$location,$http){

})

app.controller("LoginController",function($scope,$location,$http,$uibModal){

	$scope.practiceTest = "Hi";

	$scope.signUpButton = function(){
		    var modalInstance = $uibModal.open({
            templateUrl: 'signUp.html',
            controller: 'signUpController'
        });

	}
})

app.controller("signUpController",function($scope,$location,$http, $uibModalInstance){
	$scope.ok = function(){
		$uibModalInstance.close();
	}

	$scope.cancel = function(){
		$uibModalInstance.close();
	}
})