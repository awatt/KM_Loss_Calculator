'use strict';

angular.module('kmLossCalculatorApp')
.controller('MainCtrl', function ($scope, $http, allocations) {

  $http.get('/api/trades').success(function(allTrades) {
    $scope.allTrades = allTrades;
    console.log("allTrades: ", allTrades)
    $scope.accounts = [];

  //generate data linked list
  var dataList = new allocations.List
  for (var i = 0; i < allTrades.length; i++){

      //extract list of trading accounts
      if ($scope.accounts.indexOf($scope.allTrades[i].account) < 0){
        $scope.accounts.push(allTrades[i].account);
      }

      //linked list
      // console.log("alltrades account and date: ", allTrades[i].account + " '" + allTrades[i].tradeDate)
      dataList.add(allTrades[i]);

    }

    $scope.dataList = dataList;
    

    console.log("dataList: ", dataList)

    var startDate = "2010,05,20";
    var endDate = "2014,11,14";

    $scope.generateFIFO = function () {

      allocations.generateFIFO(dataList);

    } 

  });






    // $scope.allocationsLIFO = allocations.generateLIFO($scope.formattedTradeDataLIFO);








    // $scope.addThing = function() {
    //   if($scope.newThing === '') {
    //     return;
    //   }
    //   $http.post('/api/things', { name: $scope.newThing });
    //   $scope.newThing = '';
    // };

    // $scope.deleteThing = function(thing) {
    //   $http.delete('/api/things/' + thing._id);
    // };
  });
