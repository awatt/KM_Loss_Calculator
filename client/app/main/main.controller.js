'use strict';

angular.module('kmLossCalculatorApp')
.controller('MainCtrl', function ($scope, $http, linkedList, statistics) {

  $http.get('/api/trades').success(function(allTrades) {

    //temp values
    var startDate = "2010,05,20";
    var endDate = "2014,11,14";

    $scope.duraDates = ["2014,09,05","2014,09,08","2014,09,30","2014,10,09","2014,10,15","2014,10,17","2014,10,20","2014,10,24","2014,10,31","2014,11,07","2014,11,13","2014,11,14","2014,11,21"]

    //raw trade data from backend
    $scope.allTrades = allTrades;
    $scope.accounts = [];

    //new separate linked list each for FIFO and LIFO allocations
    $scope.dataListFIFO = new linkedList.List
    $scope.dataListLIFO = new linkedList.List


    // extract complete list of trading accounts for main display table and populate linked lists with raw data
    for (var i = 0; i < allTrades.length; i++){
      if ($scope.accounts.indexOf($scope.allTrades[i].account) < 0){
        $scope.accounts.push(allTrades[i].account);
      }
          $scope.dataListFIFO.add(allTrades[i]);
          $scope.dataListLIFO.add(allTrades[i]);
    }


    $scope.generateStats = function () {

      $scope.statsByAccountFIFO = statistics.generateFIFO($scope.dataListFIFO, $scope.accounts, startDate, endDate);
      $scope.statsByAccountLIFO = statistics.generateLIFO($scope.dataListLIFO, $scope.accounts, startDate, endDate);
      console.log("statsByAccountFIFO: ", $scope.statsByAccountFIFO);
      console.log("statsByAccountLIFO: ", $scope.statsByAccountLIFO);

    }

    $scope.displayDuraStats = function(){

      $scope.duraStats;


    } 

  });

});
