'use strict';

angular.module('kmLossCalculatorApp')
  .factory('statistics', function () {


  function generateFIFO(list, accounts, startDate, endDate) {
    var sales = list.findSales(startDate, endDate);
    var duraStatsFIFO = [];
    var statsByAccount = [];

    //generate baseline dura snapshot
    duraStatsFIFO.push(list.generateDuraSnapshot(startDate, endDate));

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
      duraStatsFIFO.push(list.generateDuraSnapshot(startDate, sale.el.tradeDate));

    });

    accounts.forEach(function(account){

      //generate account stats
      var accountStats = list.generateAccountStats(account, startDate, endDate);

      //filter dura by account and add to account stats object
      var accountDuraStatsFIFO = duraStatsFIFO.filter(function(el){return el.account === account})
      accountStats.duraStatsFIFO = accountDuraStatsFIFO;

      //push completed account stats object onto total stats array
      statsByAccount.push(accountStats);

    })


    return statsByAccount;
  }

  function generateLIFO(list, accounts, startDate, endDate) {
    var sales = list.findSales(startDate, endDate);
    var duraStatsLIFO = [];
    var statsByAccount = [];

    //generate baseline dura snapshot
    duraStatsLIFO.push(list.generateDuraSnapshot(startDate, endDate));

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
      duraStatsLIFO.push(list.generateDuraSnapshot(startDate, sale.el.tradeDate));

    });

    accounts.forEach(function(account){

      //generate account stats
      var accountStats = list.generateAccountStats(account, startDate, endDate);

      //filter dura by account and add to account stats object
      var accountDuraStatsLIFO = duraStatsLIFO.filter(function(el){return el.account === account})
      accountStats.duraStatsLIFO = accountDuraStatsLIFO;

      //push completed account stats object onto total stats array
      statsByAccount.push(accountStats);

    })
    return statsByAccount;  
  }


    // Public API here
    return {
      generateFIFO: generateFIFO,
      generateLIFO: generateLIFO
    };
  });



