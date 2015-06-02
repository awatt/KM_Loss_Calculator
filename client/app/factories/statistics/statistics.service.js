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

  function calculateTotals(statsByAccount){
    var totals = {
      preClassHoldings: 0,
      classPeriodPurchases: 0,
      expenditures: 0,
      classPeriodSales: 0,
      classPeriodProceeds: 0,
      recognizedSales: 0,
      recognizedProceeds: 0,
      sharesRetained: 0,
      valueOfRetainedShares: 0,
      damages_gain: 0
    };

    for (var account in statsByAccount){
      totals.preClassHoldings += statsByAccount[account].preClassHoldings;
      totals.classPeriodPurchases += statsByAccount[account].classPeriodPurchases;
      totals.expenditures += statsByAccount[account].expenditures;
      totals.classPeriodSales += statsByAccount[account].classPeriodSales;
      totals.classPeriodProceeds += statsByAccount[account].classPeriodProceeds;
      totals.recognizedSales += statsByAccount[account].recognizedSales;
      totals.recognizedProceeds += statsByAccount[account].recognizedProceeds;
      totals.sharesRetained += statsByAccount[account].sharesRetained;
      totals.valueOfRetainedShares += statsByAccount[account].valueOfRetainedShares;
      totals.damages_gain += statsByAccount[account].damages_gain;
    }

    return totals;
  }

  function generateDuraStats(duraDates, statsByAccountFIFO, statsByAccountLIFO){

      console.log("got into generateDuraStats")
      var duraStats = {};

      for (var account in statsByAccountFIFO){

        var keyFIFO = account + " (FIFO)";
        duraStats[keyFIFO] = {};

        duraDates.forEach(function(duraDate){

          var closestSnapDate = "1980,01,01";

          var snapShots = statsByAccountFIFO[account].duraStats;

          for (var snapDate in snapShots){

            if (snapDate > closestSnapDate && snapDate <= duraDate){
              closestSnapDate = snapDate;
            }
          }

          duraStats[keyFIFO][duraDate] = snapShots[closestSnapDate];

        })
      }

      for (var account in statsByAccountLIFO){

        var keyLIFO = account + " (LIFO)";
        duraStats[keyLIFO] = {};

        duraDates.forEach(function(duraDate){

          var closestSnapDate = "1980,01,01";

          var snapShots = statsByAccountLIFO[account].duraStats;

          for (var snapDate in snapShots){

            if (snapDate > closestSnapDate && snapDate <= duraDate){
              closestSnapDate = snapDate;
            }
          }

          duraStats[keyLIFO][duraDate] = snapShots[closestSnapDate];

        })
      }
      return duraStats;
  }


    // Public API here
    return {
      generateFIFO: generateFIFO,
      generateLIFO: generateLIFO,
      calculateTotals: calculateTotals,
      generateDuraStats: generateDuraStats
    };
  });



