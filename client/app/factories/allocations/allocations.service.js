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
    newNode.next = currNode.next;
    newNode.prev = currNode;
    currNode.next = newNode;
  }

  List.prototype.findSales = function() {
    var sales = [];
    var currNode = this.head;
    while (currNode !== this.tail){


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
    console.log("currSale in findAllocatableBuys: ", currSale)
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

  List.prototype.allocateSales = function(buyNode, saleNode){

    var offset = buyNode.el.allocatables + saleNode.el.allocatables;
    if(offset > 0){
      buyNode.el.allocatables = offset;
      saleNode.el.allocatables = 0;
    } else {
      buyNode.el.allocatables = 0;
      saleNode.el.allocatables = offset;
    }
    return saleNode;
  }

  List.prototype.allocateWithdrawals = function(buyNode, withdrawalNode){

    // console.log("buyNode in allocateWithdrawals: ", buyNode)
    var newTrade = {
      account: withdrawalNode.el.transferAccount,
      tradeDate: withdrawalNode.el.tradeDate,
      holdingType: buyNode.el.holdingType,
      pricePerShare: buyNode.el.pricePerShare,
      quantity: 0,
      allocatables: 0,
      transactionType: "BUY",
      transferAccount: withdrawalNode.el.account
    };

    var offset = buyNode.el.allocatables + withdrawalNode.el.allocatables;
    var allocated = 0;
    if(offset > 0){
      buyNode.el.allocatables = offset;
      allocated = withdrawalNode.el.allocatables;
      withdrawalNode.el.allocatables = 0;
    } else {
      buyNode.el.allocatables = 0;
      allocated = withdrawalNode.el.allocatables - offset;
      withdrawalNode.el.allocatables = offset;
    }

    newTrade.quantity = -allocated;
    newTrade.allocatables = -allocated

    this.insert(newTrade, withdrawalNode);

    return withdrawalNode;
  }

  function generateFIFO(list) {
    var sales = list.findSales();

    sales.forEach(function(sale){
      var buys = list.findAllocatableBuys(sale);
      var i = 0;

      while(sale.el.allocatables < 0){
        if (sale.el.transactionType === "SELL"){
          console.log("sale allocatables and account before: ", sale.el.tradeDate + " " + sale.el.account +" "+ sale.el.allocatables)
          console.log("buy tradeDate account and allocatables before: ", buys[i].el.tradeDate +" "+ buys[i].el.account +" "+ buys[i].el.allocatables)
          sale = list.allocateSales(buys[i], sale);
          console.log("sale allocatables after: ", sale.el.tradeDate + " " + sale.el.account +" "+ sale.el.allocatables)
          i++;
        } else {
          console.log("withdrawal allocatables and account before: ", sale.el.tradeDate + " " + sale.el.account +" "+ sale.el.allocatables)
          console.log("buy tradeDate account and allocatables before: ", buys[i].el.tradeDate +" "+ buys[i].el.account +" "+ buys[i].el.allocatables)
          sale = list.allocateWithdrawals(buys[i], sale);
          console.log("withdrawal allocatables after: ", sale.el.tradeDate + " " + sale.el.account +" "+ sale.el.allocatables)
          i++;
        }
      }

    })

  }



  function generatLIFO(list){

  }


    // Public API here
    return {
      generateFIFO: generateFIFO,
      List: List
    };
  });



