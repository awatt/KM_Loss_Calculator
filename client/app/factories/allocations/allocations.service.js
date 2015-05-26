'use strict';

angular.module('kmLossCalculatorApp')
  .factory('allocations', function () {

function Node(trade) {

  var newEl = {
    account: trade.account,
    tradeDate: trade.tradeDate,
    holdingType: trade.holdingType,
    pricePerShare: trade.pricePerShare,
    quantity: trade.quantity,
    allocatables: trade.quantity,
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
    newNode.next = current.next;
    newNode.prev = current;
    current.next = newNode;
  }

  List.prototype.findSales = function() {
    var sales = [];
    var currNode = this.head;
    console.log("currNode: ", currNode)
    while (currNode !== this.tail){


      if(currNode.el.transactionType === 'SELL' && currNode.el.allocatables < 0){
        console.log("sales: ", currNode)
        sales.push(currNode)
      }

      if(currNode.el.transactionType === 'WITHDRAWAL' && currNode.el.allocatables < 0){
        console.log("withdrawals: ", currNode)
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
      if(currNode.el.account === currSale.el.account && currNode.el.transactionType === 'BUY' && currNode.el.allocatables > 0){
        allocatableBuys.push(currNode);
      }
      currNode = currNode.next;
    }
    return allocatableBuys;
  }

  List.prototype.allocateSales = function(buyNode, saleNode){
    var offset = buyNode.allocatables + saleNode.allocatables;
    if(offset > 0){
      buyNode.allocatables = offset;
      saleNode.allocatables = 0;
    } else {
      buyNode.allocatables = 0;
      saleNode.allocatables = offset;
    }
    return saleNode;
  }

  List.prototype.allocateWithdrawals = function(buyNode, withdrawalNode){
    
    var newTrade = {
      account: withdrawalNode[transferAccount],
      tradeDate: withdrawalNode[tradeDate],
      holdingType: buyNode[holdingType],
      pricePerShare: buyNode[pricePerShare],
      quantity: 0,
      allocatables: 0,
      transactionType: buyNode[transactionType],
      transferAccount: ""
    };

    


    var offset = buyNode.allocatables + withdrawalNode.allocatables;
    if(offset > 0){
      buyNode.allocatables = offset;
      withdrawalNode.allocatables = 0;
    } else {
      buyNode.allocatables = 0;
      withdrawalNode.allocatables = offset;
    }
    return withdrawalNode;
  }

  function generateFIFO() {
    var lastNode = this.findLast();
    console.log("lastNode in generateFIFO: ", lastNode)
    var currSale = findNextSales(this.head);
    console.log("currSale in generateFIFO: ", currSale)
    var buyNode = findNextAllocatables(currSale, this.head);
    console.log("buyNode in generateFIFO: ", buyNode)
    var duraStats = [];

    var counter = 1;
    
    while(currSale.next !== lastNode){

      while (currSale.allocatables < 0) {
        var stats = allocateSales(buyNode, currSale.allocatables);
        console.log("stats in generateFIFO: ", stats)
        currSale.allocatables = stats[numShares];
        duraStats.push(stats);
        console.log("duraStats in generateFIFO: ", duraStats)
        buyNode = findNextAllocatables(buyNode);
      }

      currSale = findNextSales(currSale);
      console.log(currSale)
      buyNode = findNextAllocatables(currSale, buyNode);
      console.log(buyNode)

      console.log(counter);
      counter++

    }

    return duraStats;

  }


    // Public API here
    return {
      generateFIFO: generateFIFO,
      List: List
    };
  });



