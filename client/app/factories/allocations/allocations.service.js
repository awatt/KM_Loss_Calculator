'use strict';

angular.module('kmLossCalculatorApp')
  .factory('allocations', function () {

    function formatTradeData (allTrades){
      var hashTable = {};
      var hashTableClone = {};

      allTrades.forEach(function(trade){

        var thisDate = trade.tradeDate;
        
        if (!hashTable.hasOwnProperty(thisDate)){
          hashTable[thisDate] = [];
          hashTableClone[thisDate] = [];
        }

        hashTable[thisDate].push({
          account: trade.account,
          holdingType: trade.holdingType,
          pricePerShare: trade.pricePerShare,
          quantity: trade.quantity,
          transactionType: trade.transactionType
        });

        hashTableClone[thisDate].push({
          account: trade.account,
          holdingType: trade.holdingType,
          pricePerShare: trade.pricePerShare,
          quantity: trade.quantity,
          transactionType: trade.transactionType
        });

      })

      return [hashTable, hashTableClone];
    }


    function matchBuys (account, soldShares) {
      //search date for allocable bought shares
      //create allocated bought shares data object
      //push object onto Dura array 

    }





    

    function generateFIFO (formattedTradeDataFIFO, accounts, startDate, endDate) {
      
      //extract date keys
      var keys = [];
      for(var k in formattedTradeDataFIFO){
        keys.push(k);
      }

      //sort by date order
      keys.sort(function(a,b){
        return new Date(a) - new Date(b);
      });

      //crop to selected date range
      keys = keys.slice(keys.indexOf(startDate), keys.indexOf(endDate) + 1)
      
      console.log("keys: ", keys)

      //FIFO data results object to generate summary table
      var damagesSummary = {
        preClassHoldings: Number,
        classPeriodPurchases: Number,
        expenditures: Number,
        classPeriodSales: Number,
        classPeriodProceeds: Number,
        fifoRecognizedSales: Number,
        fifoRecognizedProceeds: Number,
        sharesRetained: Number,
        valueOfRetainedShares: Number,
        damagesGain: Number
      };

      //

      for (var i = 0, max = keys.length; i < max; i ++){



      }




    }


    function generateLIFO (formattedTradeDataLIFO) {





    }


    // Public API here
    return {
      formatTradeData: formatTradeData,
      generateLIFO: generateLIFO,
      generateFIFO: generateFIFO
    };
  });



