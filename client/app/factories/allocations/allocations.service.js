'use strict';

angular.module('kmLossCalculatorApp')
  .factory('allocations', function () {

function Node(trade) {

  var setClassBuys = function(trade){
    var allocation = 0;
    if (trade.transactionType === "BUY"){
      allocation = trade.quantity;
    }
    return allocation;
  }

  var newEl = {
    account: trade.account,
    tradeDate: trade.tradeDate,
    holdingType: trade.holdingType,
    pricePerShare: trade.pricePerShare,
    quantity: trade.quantity,
    allocatables: trade.quantity,
    allocatedToOther: 0,
    allocatedToClassBuy: setClassBuys(trade),
    allocatedToClassSell: 0,
    allocatedToTransClassShares: 0,
    transactionType: trade.transactionType,
    transferAccount: trade.transferAccount
  };

  this.el = newEl;
  this.next = null;
  this.prev = null;
}

  function List() {
    this.head = null;
    this.tail = null;
    this.length = 0;
  }

  List.prototype.add = function(trade) {
    var newNode = new Node(trade);
    if(this.head === null){
      this.head = newNode;
      this.tail = newNode;
    } else {
      newNode.prev = this.tail;
      this.tail.next = newNode;
      this.tail = newNode;
    }
    this.length++;
  }

  List.prototype.insert = function(newEl, currNode) {
    var newNode = new Node(newEl);
    // console.log("newNode inserts account tradeDate quantity pricePerShare: ", newNode.el.account +" "+ newNode.el.tradeDate+" "+newNode.el.quantity+" "+newNode.el.pricePerShare)
    
    newNode.next = currNode;
    newNode.prev = currNode.prev;
    currNode.prev.next = newNode;
    currNode.prev = newNode;
    this.length++;
  }

  List.prototype.findSales = function(startDate, endDate) {
    var sales = [];
    var currNode = this.head;
    while (currNode !== this.tail && currNode.el.tradeDate >= startDate && currNode.el.tradeDate <= endDate){


      if(currNode.el.transactionType === 'SELL' && currNode.el.allocatables < 0){
        sales.push(currNode)
      }

      if(currNode.el.transactionType === 'WITHDRAWAL' && currNode.el.allocatables < 0){
        sales.push(currNode)
      }

      currNode = currNode.next;
    }
    return sales;
  }

  List.prototype.findAllocatableBuys = function(currSale) {

    var allocatableBuys = [];
    var currNode = this.head;
    while (currNode !== currSale){
      if(currNode.el.account === currSale.el.account 
        && currNode.el.allocatables > 0 
        && (currNode.el.transactionType === 'BUY'|| currNode.el.holdingType === 'Beginning Holdings')){
        allocatableBuys.push(currNode);
      }
      currNode = currNode.next;
    }
    return allocatableBuys;
  }

  List.prototype.findBeginningHoldings = function(account) {

    var currNode = this.head;
    while (currNode !== this.tail){
      if(currNode.el.account === account && currNode.el.holdingType === "Beginning Holdings"){
        return currNode;
      }
      currNode = currNode.next;
    }
  }

  List.prototype.allocateSales = function(buyNode, saleNode){

    var offset = buyNode.el.allocatables + saleNode.el.allocatables;
    if(offset > 0){
      if(buyNode.el.holdingType === "Beginning Holdings"){
        saleNode.el.allocatedToOther += saleNode.el.allocatables;
        buyNode.el.allocatables = offset;
        saleNode.el.allocatables = 0;
      } else {
        saleNode.el.allocatedToClassSell += saleNode.el.allocatables;
        buyNode.el.allocatables = offset;
        saleNode.el.allocatables = 0;
      }
    } else {
      if(buyNode.el.holdingType === "Beginning Holdings"){
        saleNode.el.allocatedToOther -= buyNode.el.allocatables;
        saleNode.el.allocatables = offset;
        buyNode.el.allocatables = 0;
      } else {
        saleNode.el.allocatedToClassSell -= buyNode.el.allocatables;
        saleNode.el.allocatables = offset;
        buyNode.el.allocatables = 0;
      }
    }
    return saleNode;
  }

  List.prototype.allocateWithdrawals = function(buyNode, withdrawalNode){

    var offset = buyNode.el.allocatables + withdrawalNode.el.allocatables;
    //get transfer account's beginning holdings node
    var transferAccountBegHoldings = this.findBeginningHoldings(withdrawalNode.el.transferAccount);

    if(offset > 0){
      if(buyNode.el.holdingType === "Beginning Holdings"){
        //allocate the withdrawal from one account into the other, transferring that amount
        //of beginning holdings over
        withdrawalNode.el.allocatedToOther += withdrawalNode.el.allocatables;
        buyNode.el.quantity += withdrawalNode.el.allocatables;
        transferAccountBegHoldings.el.quantity -= withdrawalNode.el.allocatables;
        transferAccountBegHoldings.el.allocatables -= withdrawalNode.el.allocatables;
        buyNode.el.allocatables = offset;
        withdrawalNode.el.allocatables = 0;

      } else {
        //allocate the withdrawal to class shares in the account, then transfer them
        //over to transfer account as new buys
        withdrawalNode.el.allocatedToTransClassShares = withdrawalNode.el.allocatables;
        buyNode.el.allocatedToClassBuy += withdrawalNode.el.allocatables;
        buyNode.el.allocatables = offset;
        withdrawalNode.el.allocatables = 0;
        this.transferNewShares(buyNode, withdrawalNode);
      }
    } else {
      if(buyNode.el.holdingType === "Beginning Holdings"){
        //allocate the withdrawal from one account into the other, transferring that amount
        //of beginning holdings over
        withdrawalNode.el.allocatedToOther -= buyNode.el.allocatables;
        buyNode.el.quantity -= buyNode.el.allocatables;
        transferAccountBegHoldings.el.quantity += buyNode.el.allocatables;
        transferAccountBegHoldings.el.allocatables += buyNode.el.allocatables;
        withdrawalNode.el.allocatables = offset;
        buyNode.el.allocatables = 0;
        

      } else {
        //allocate the withdrawal to class shares in the account, then transfer them
        //over to transfer account as new buys
        withdrawalNode.el.allocatedToTransClassShares = -buyNode.el.allocatables;
        buyNode.el.allocatedToClassBuy -= buyNode.el.allocatables;
        withdrawalNode.el.allocatables = offset;
        buyNode.el.allocatables = 0;
        this.transferNewShares(buyNode, withdrawalNode);
      }
    }
    return withdrawalNode;
  }


  List.prototype.transferNewShares = function(buyNode, withdrawalNode){

    var newTrade = {
      account: withdrawalNode.el.transferAccount,
      tradeDate: withdrawalNode.el.tradeDate,
      holdingType: buyNode.el.holdingType,
      pricePerShare: buyNode.el.pricePerShare,
      quantity: -withdrawalNode.el.allocatedToTransClassShares,
      allocatables: -withdrawalNode.el.allocatedToTransClassShares,
      allocatedToOther: 0,
      allocatedToClassBuy: -withdrawalNode.el.allocatedToTransClassShares,
      allocatedToClassSell: 0,
      allocatedToTransClassShares: 0,
      transactionType: "BUY",
      transferAccount: withdrawalNode.el.account
    };
    this.insert(newTrade, withdrawalNode);
  }

  List.prototype.generateAccountStats = function(account, startDate, endDate) {
    
    var currNode = this.head, sharesPurchased = 0, expenditures = 0, sharesSold = 0, proceeds = 0; 
    var testquantity = 0;
    
    while (currNode !== this.tail) {

      if(currNode.el.transactionType === "BUY" && currNode.el.account === account && currNode.el.tradeDate >= startDate && currNode.el.tradeDate <= endDate){
        
        sharesPurchased += currNode.el.allocatedToClassBuy;
        expenditures += currNode.el.allocatedToClassBuy*currNode.el.pricePerShare;

        console.log("sharesPurchased: ", sharesPurchased)
        console.log("expenditures: ", expenditures)

        
        if(currNode.el.tradeDate === '2014,02,03'){
          testquantity += currNode.el.allocatedToClassBuy;
        }

        console.log("buy tradeDate account:", currNode.el.tradeDate+" "+currNode.el.account)
        console.log("quantity allocated to class buys: ", currNode.el.allocatedToClassBuy)
        console.log("pricePerShare: ", currNode.el.pricePerShare)

      }
      if(currNode.el.transactionType === "SELL" && currNode.el.account === account && currNode.el.tradeDate >= startDate && currNode.el.tradeDate <= endDate){
    
        sharesSold -= currNode.el.allocatedToClassSell
        proceeds -= currNode.el.allocatedToClassSell*currNode.el.pricePerShare;

        // console.log("sell tradeDate account sharesSold pricePerShare: ", currNode.el.tradeDate+" "+currNode.el.account+" "+ (currNode.el.quantity - currNode.el.allocatables - currNode.el.preClassAllocations)+" "+currNode.el.pricePerShare)

        // console.log("buy tradeDate account:", currNode.el.tradeDate+" "+currNode.el.account)
        // console.log("quantity allocated to class buys: ", currNode.el.allocatedToClassBuy)
        // console.log("pricePerShare: ", currNode.el.pricePerShare)


      }
      currNode = currNode.next;
    }

    return {
      sharesPurchased: sharesPurchased,
      expenditures: expenditures,
      sharesSold: sharesSold,
      proceeds: proceeds,
      testquantity: testquantity
    };
  }

  function generateFIFO(list, startDate, endDate) {
    var sales = list.findSales(startDate, endDate);

    sales.forEach(function(sale){
      var buys = list.findAllocatableBuys(sale);
      var i = 0;

      while(sale.el.allocatables < 0){
        if (sale.el.transactionType === "SELL"){
          // console.log("sale allocatables and account before: ", sale.el.tradeDate + " " + sale.el.account +" "+ sale.el.allocatables)
          // console.log("buy tradeDate account and allocatables before: ", buys[i].el.tradeDate +" "+ buys[i].el.account +" "+ buys[i].el.allocatables)
          sale = list.allocateSales(buys[i], sale);
          // console.log("sale allocatables after: ", sale.el.tradeDate + " " + sale.el.account +" "+ sale.el.allocatables)
          i++;
        } else {
          // console.log("withdrawal allocatables and account before: ", sale.el.tradeDate + " " + sale.el.account +" "+ sale.el.allocatables)
          // console.log("buy tradeDate account allocatables and holding type before: ", buys[i].el.tradeDate +" "+ buys[i].el.account +" "+ buys[i].el.allocatables+" "+ buys[i].el.holdingType)
          sale = list.allocateWithdrawals(buys[i], sale);

          // console.log("withdrawal allocatables after: ", sale.el.tradeDate + " " + sale.el.account +" "+ sale.el.allocatables)
          i++;
        }
      };

    });

    return list.generateAccountStats("Account 2", startDate, endDate);

  }


  function generateLIFO(list, startDate, endDate) {
    var sales = list.findSales(startDate, endDate);

    sales.forEach(function(sale){
      var buys = list.findAllocatableBuys(sale);
      buys = buys.reverse();

      var i = 0;

      while(sale.el.allocatables < 0){
        if (sale.el.transactionType === "SELL"){
          // console.log("sale allocatables and account before: ", sale.el.tradeDate + " " + sale.el.account +" "+ sale.el.allocatables)
          // console.log("buy tradeDate account and allocatables before: ", buys[i].el.tradeDate +" "+ buys[i].el.account +" "+ buys[i].el.allocatables)
          sale = list.allocateSales(buys[i], sale);
          // console.log("sale allocatables after: ", sale.el.tradeDate + " " + sale.el.account +" "+ sale.el.allocatables)
          i++;
        } else {
          // console.log("withdrawal allocatables and account before: ", sale.el.tradeDate + " " + sale.el.account +" "+ sale.el.allocatables)
          // console.log("buy tradeDate account allocatables and holding type before: ", buys[i].el.tradeDate +" "+ buys[i].el.account +" "+ buys[i].el.allocatables+" "+ buys[i].el.holdingType)
          sale = list.allocateWithdrawals(buys[i], sale);

          // console.log("withdrawal allocatables after: ", sale.el.tradeDate + " " + sale.el.account +" "+ sale.el.allocatables)
          i++;
        }
      };

    });

    return list.generateAccountStats("Account 2", startDate, endDate);

  }


    // Public API here
    return {
      generateFIFO: generateFIFO,
      generateLIFO: generateLIFO,
      List: List
    };
  });



