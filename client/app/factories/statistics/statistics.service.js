'use strict';

angular.module('kmLossCalculatorApp')
  .factory('statistics', function () {


  function generateFIFO(list, accounts, startDate, endDate) {
    var sales = list.findSales(startDate, endDate);
    var duraSnapshots = [];
    var statsByAccount = {};

    //generate baseline dura snapshot
    duraSnapshots.push(list.generateDuraSnapshot(startDate));

    //iterate over list for allocatable buy transactions up to and including sale date
    sales.forEach(function(sale){
      var buys = list.findAllocatableBuys(sale);
      var i = 0;

      while(sale.el.allocatables < 0){
        if (sale.el.transactionType === "SELL"){
          sale = list.allocateSales(buys[i], sale);
          i++;
        } else {
          sale = list.allocateWithdrawals(buys[i], sale);
          i++;
        }
      };

      //take Dura snapshot after each allocation and store 
      duraSnapshots.push(list.generateDuraSnapshot(sale.el.tradeDate));

    });


    accounts.forEach(function(account){

      var duraStats = {};

      //filter all snapshot arrays by account and hash onto duraStats object by snapDate 
      for (var i = 0, max = duraSnapshots.length; i < max; i++){
        var snapDate = duraSnapshots[i][0].snapDate;
        duraStats[snapDate] = duraSnapshots[i].filter(function(el){return el.account === account})
      }

      //generate account stats
      var accountStats = list.generateAccountStats(account, startDate, endDate);

      //add filtered duraStats to account stats object
      var duraKey = "duraStats";
      accountStats[duraKey] = {};
      accountStats["duraStats"] = duraStats;

      //push completed account stats object onto total stats array
      var accountKey = account;
      statsByAccount[accountKey] = accountStats;

    })


    return statsByAccount;
  }

  function generateLIFO(list, accounts, startDate, endDate) {
    var sales = list.findSales(startDate, endDate);
    var duraSnapshots = [];
    var statsByAccount = {};

    //generate baseline dura snapshot
    duraSnapshots.push(list.generateDuraSnapshot(startDate));

    //iterate over list for allocatable buy transactions up to and including sale date
    sales.forEach(function(sale){
      var buys = list.findAllocatableBuys(sale);
      buys = buys.reverse();
      var i = 0;

      while(sale.el.allocatables < 0){
        if (sale.el.transactionType === "SELL"){
          sale = list.allocateSales(buys[i], sale);
          i++;
        } else {
          sale = list.allocateWithdrawals(buys[i], sale);
          i++;
        }
      };

      //take Dura snapshot after each allocation and store 
      duraSnapshots.push(list.generateDuraSnapshot(sale.el.tradeDate));

    });


    accounts.forEach(function(account){

      var duraStats = {};

      //filter all snapshot arrays by account and hash onto duraStats object by snapDate 
      for (var i = 0, max = duraSnapshots.length; i < max; i++){
        var snapDate = duraSnapshots[i][0].snapDate;
        duraStats[snapDate] = duraSnapshots[i].filter(function(el){return el.account === account})
      }

      //generate account stats
      var accountStats = list.generateAccountStats(account, startDate, endDate);

      //add filtered duraStats to account stats object
      var key = "duraStats";
      accountStats[key] = {};
      accountStats["duraStats"] = duraStats;

      //push completed account stats object onto total stats array
      var accountKey = account;
      statsByAccount[accountKey] = accountStats;

    })
    return statsByAccount;  
  }


    // Public API here
    return {
      generateFIFO: generateFIFO,
      generateLIFO: generateLIFO
    };
  });



