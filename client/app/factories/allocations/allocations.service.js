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
          quantityAllocated: 0,
          transactionType: trade.transactionType,
          transferAccount: trade.transferAccount
        });

        hashTableClone[thisDate].push({
          account: trade.account,
          holdingType: trade.holdingType,
          pricePerShare: trade.pricePerShare,
          quantity: trade.quantity,
          quantityAllocated: 0,
          transactionType: trade.transactionType,
          transferAccount: trade.transferAccount
        });

      })

      return [hashTable, hashTableClone];
    }


    function linkTransfers (){
    }


    function generateSummaryResults () {
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

    }


    function extractSortedDateKeys(obj){

      
    var keys = [];

    for(var k in obj){
      keys.push(k);
    }

      //sort by date order
      keys.sort(function(a,b){
        return new Date(a) - new Date(b);
      });

      return keys;

    }
    

    function matchBuys (data, tradeHistoryKeys, duraData, tradeDate, account, quantity, transactionType, transferAccount) {

      for (var i = 0, max = tradeHistoryKeys.length; i < max; i++){

        var allocateDate = data[tradeHistoryKeys[i]];

        console.log("allocateDate: ", allocateDate)

                  console.log("THIS IS quantity at i: ", i +" "+ quantity)

        for (var j = 0, max = allocateDate.length; j < max; j++){

                    // console.log("THIS IS quantity at j: ", j +" "+ quantity)

          var trxn = allocateDate[j];

          // console.log("trxn: ", trxn)


          var allocatables = function(){
            return trxn.quantity - trxn.quantityAllocated;
          }

          // console.log("trxn.quantityAllocated: ", trxn.quantityAllocated)
          // console.log("trxn.quantity: ", trxn.quantity)

          //if there are beginning holdings to allocate
          if (trxn.account === account && trxn.holdingType === "Beginning Holdings" && allocatables() > 0){


            //and more beginning holdings remain to allocate than the current sale amount
            if(allocatables() - quantity >= 0){
              
              //allocate the full amount of the sale to the beginning holdings
              trxn.quantityAllocated += quantity;

              quantity = 0;

              //if allocatable beginning holdings only partially offset the sales, allocate only that amount
            } else {
              // console.log("allocatables(): ", allocatables())
              quantity -= allocatables();
              trxn.quantityAllocated = trxn.quantity;

          //     console.log("allocatables: ", allocatables)
          // console.log("quantity: ", quantity)
          // console.log("trxn.quantityAllocated: ", trxn.quantityAllocated)

            };

          };

          //if there are bought shares to allocate
          if (trxn.account === account && trxn.transactionType === "BUY" && allocatables() > 0){

            //and more allocatable shares remain in this BUY trxn than the current sale amount
            if(allocatables() - quantity >= 0){
              // console.log("allocatables(): ", allocatables())

              var newQuantityAllocated = quantity;

              //allocate the full amount of the sale to this BUY trxn
              trxn.quantityAllocated += quantity;
              quantity = 0;

              //if allocatable shares of this BUY trxn only partially offset the sales, allocate only that amount
              //and push held share data to dura data-structure
              var duraHoldings = {
                pricePerShare: trxn.pricePerShare, 
                quantity: allocatables(), 
                tradeDate: tradeDate, 
                allocateDate: tradeHistoryKeys[i]
              }
              
              duraData[trxn.account].push(duraHoldings);

              //for withdrawals, push new BUY object onto transferAccount
              if (transactionType === "WITHDRAWAL"){
                
                var reallocation = {
                  account: transferAccount,
                  holdingType: "",
                  pricePerShare: trxn.pricePerShare,
                  quantity: newQuantityAllocated,
                  transactionType: "BUY",
                  transactionSubType: "REALLOCATION",
                  transferAccount: ""
                }
                
                data[tradeDate].push(reallocation)
              }


            } else {

              var newQuantityAllocated = allocatables();

              quantity -= allocatables();
              trxn.quantityAllocated = trxn.quantity;

              //push the unallocated (held) bought shares data onto dura data structure
              //for withdrawals, push new BUY object onto transferAccount
              if (transactionType === "WITHDRAWAL"){
                
                var reallocation = {
                  account: transferAccount,
                  holdingType: "",
                  pricePerShare: trxn.pricePerShare,
                  quantity: newQuantityAllocated,
                  transactionType: "BUY",
                  transactionSubType: "REALLOCATION",
                  transferAccount: ""
                }
                
                data[tradeDate].push(reallocation)
              }


              // console.log("duraData[trxn.account]: ", duraData[trxn.account])



            };
          };
        };
      };
    };


    function generateFIFO (data, accounts, startDate, endDate) {
      
      //create object for dura holdings snapshots by account
      var duraData = {};

      for (var i = 0; i < accounts.length; i++){
        duraData[accounts[i]] = [];
      }

      // console.log("duraData snapshots: ",duraData)

      //extract and sort date keys
      var keys = extractSortedDateKeys(data);

      // console.log("data: ", data)

      // console.log("keys: ", keys)

      //crop to selected date range
      keys = keys.slice(keys.indexOf(startDate), keys.indexOf(endDate) + 1)
  
      for (var i = 0, max = keys.length; i < max; i++){

        console.log("generateFIFO i :", i)

        var tradeDate = data[keys[i]];
        console.log("tradeDate: ", tradeDate)
        var tradeHistoryKeys = keys.slice(0, i + 1);
        // console.log("tradeHistoryKeys.length: ", tradeHistoryKeys.length)


        for (var j = 0; j < tradeDate.length; j++){

          console.log("generateFIFO j :", j)

            if (tradeDate[j].transactionType === "SELL" || tradeDate[j].transactionType === "WITHDRAWAL"){

              // console.log("date: ", keys[i], " tradeDate[j]: ", tradeDate[j])
              // console.log("parameters - data: ", data)

              matchBuys(data, tradeHistoryKeys, duraData, keys[i], tradeDate[j].account, -tradeDate[j].quantity, tradeDate[j].transactionType, tradeDate[j].transferAccount);
            
            }
      
        }
      
      }


      // console.log("data: ", data)

    }



    



    function generateLIFO (formattedTradeDataLIFO) {





    }


    function generateDuraHoldings (arr){
      //push held, unallocated bought shares onto Dura Object


    }


    // Public API here
    return {
      formatTradeData: formatTradeData,
      generateLIFO: generateLIFO,
      generateFIFO: generateFIFO
    };
  });



