'use strict';

angular.module('kmLossCalculatorApp')
.controller('MainCtrl', function ($scope, $http, allocations) {

  $http.get('/api/trades').success(function(allTrades) {
    $scope.allTrades = allTrades;
    console.log("allTrades: ", allTrades)
    $scope.accounts = [];

    for (var i = 0; i < allTrades.length; i++){
      if ($scope.accounts.indexOf($scope.allTrades[i].account) < 0){
        $scope.accounts.push(allTrades[i].account);
      }
    }

    $scope.formattedTradeDataFIFO = allocations.formatTradeData($scope.allTrades)[0];
    $scope.formattedTradeDataLIFO = allocations.formatTradeData($scope.allTrades)[1];
    console.log("formatted hash table FIFO: ", $scope.formattedTradeDataFIFO)


    var startDate = "2010,05,20";
    var endDate = "2014,11,14";


    $scope.allocationsFIFO = allocations.generateFIFO($scope.formattedTradeDataFIFO, $scope.accounts, startDate, endDate);  


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
