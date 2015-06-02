'use strict';

angular.module('kmLossCalculatorApp')
.controller('MainCtrl', function ($scope, $http, linkedList, statistics) {

    //Panel Show Logic
    $scope.currentPanel = 0;

    $scope.showNextPanel = function(currentPanel){
        if (currentPanel<2){
          $scope.currentPanel+=1;
        }
    };
    $scope.showPrevPanel = function(){
      if ($scope.currentPanel!==0){
        $scope.currentPanel-=1;
      }
    };

  $http.get('/api/trades').success(function(allTrades) {

    //temp values
    $scope.startDate = "2010,05,20";
    $scope.endDate = "2014,11,14";


    $scope.newStartDate = new Date($scope.startDate)
    $scope.newEndDate = new Date($scope.endDate)

    $scope.duraDates = ["2014,09,05","2014,09,08","2014,09,30","2014,10,09","2014,10,15","2014,10,17","2014,10,20","2014,10,24","2014,10,31","2014,11,07","2014,11,13","2014,11,14","2014,11,21"]

    //raw trade data from backend
    $scope.allTrades = allTrades;
    $scope.accounts = [];

    console.log("allTrades: ", allTrades)

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

      $scope.statsByAccountFIFO = statistics.generateFIFO($scope.dataListFIFO, $scope.accounts, $scope.startDate, $scope.endDate);
      $scope.statsByAccountLIFO = statistics.generateLIFO($scope.dataListLIFO, $scope.accounts, $scope.startDate, $scope.endDate);
      $scope.totalsFIFO = statistics.calculateTotals($scope.statsByAccountFIFO);
      $scope.totalsLIFO = statistics.calculateTotals($scope.statsByAccountLIFO);

    }


    $scope.displayDuraStats = function(){

      $scope.duraStats = statistics.generateDuraStats($scope.duraDates, $scope.statsByAccountFIFO, $scope.statsByAccountLIFO);
      console.log($scope.duraStats)

    } 


//test tabs

var tabs = [
          { title: 'One', content: "Tabs will become paginated if there isn't enough room for them."},
          { title: 'Two', content: "You can swipe left and right on a mobile device to change tabs."},
          { title: 'Three', content: "You can bind the selected tab via the selected attribute on the md-tabs element."},
          { title: 'Four', content: "If you set the selected tab binding to -1, it will leave no tab selected."},
          { title: 'Five', content: "If you remove a tab, it will try to select a new one."},
          { title: 'Six', content: "There's an ink bar that follows the selected tab, you can turn it off if you want."},
          { title: 'Seven', content: "If you set ng-disabled on a tab, it becomes unselectable. If the currently selected tab becomes disabled, it will try to select the next tab."},
          { title: 'Eight', content: "If you look at the source, you're using tabs to look at a demo for tabs. Recursion!"},
          { title: 'Nine', content: "If you set md-theme=\"green\" on the md-tabs element, you'll get green tabs."},
          { title: 'Ten', content: "If you're still reading this, you should just go check out the API docs for tabs!"}
        ];

        
    $scope.tabs = tabs;














  });

});
