'use strict';

var _ = require('lodash');
var Sale = require('./sale.model');
var Buy = require('../buy/buy.model');
var Dura = require('../dura/dura.model');
var BegHolding = require('../begholding/begholding.model');
// var mongoose = require('mongoose')
var Promise = require("bluebird");
Promise.promisifyAll(require("mongoose"));

// var mongoose = require('mongoose'),
//     mongooseBird = require('mongoose-bird')(mongoose)

// Get list of sales
exports.index = function(req, res) {
  Sale.find(function (err, sales) {
    if(err) { return handleError(res, err); }
    return res.json(200, sales);
  });
};




function allocateSale_FIFO (sale, buysArray){

  var updatedBuysArray = [], allocatableSales = sale.allocatables;

  for (var i = 0, max = buysArray.length; i < max; i++){

    if (allocatableSales === 0){

      var newDura = new Dura({
        account: sale.account,
        tradeDate: buysArray[i].tradeDate,
        duraDate: sale.tradeDate,
        quantity: buysArray[i].allocatables,
        pricePerShare: buysArray[i].pricePerShare
      });

      updatedBuysArray.push(newDura.saveAsync());
    }

    if (allocatableSales !== 0 && allocatableSales + buysArray[i].allocatables <= 0){

      if(buysArray[i].transactionType === "BEGHOLDINGS"){
        updatedBuysArray.push(BegHolding.findByIdAndUpdateAsync(buysArray[i]._id, { $set: { allocatables: 0 }}));
      } else {
        updatedBuysArray.push(Buy.findByIdAndUpdateAsync(buysArray[i]._id, { $set: { allocatables: 0 }}));
      }

      if(sale.transactionType === "WITHDRAWAL" && buysArray[i].transactionType === "BEGHOLDINGS"){
        
        updatedBuysArray.push(BegHolding.updateOne({account: sale.transferAccount}, {$inc: {allocatables: buysArray[i].allocatables }}))

      } else if (sale.transactionType === "WITHDRAWAL") {

        var newBuy = new Buy({
          account: sale.transferAccount,
          tradeDate: sale.tradeDate,
          transactionType: 'BUY',
          quantity: buysArray[i].allocatables,
          allocatables: buysArray[i].allocatables,
          pricePerShare: buysArray[i].pricePerShare
        });

        updatedBuysArray.push(newBuy.saveAsync());

      }
      allocatableSales += buysArray[i].allocatables;
    }

    if (allocatableSales !== 0 && allocatableSales + buysArray[i].allocatables > 0){
      
      if(buysArray[i].transactionType === "BEGHOLDINGS"){
        updatedBuysArray.push(BegHolding.findByIdAndUpdateAsync(buysArray[i]._id, { $set: { allocatables: allocatableSales + buysArray[i].allocatables }}));
      } else {
        updatedBuysArray.push(Buy.findByIdAndUpdateAsync(buysArray[i]._id, { $set: { allocatables: allocatableSales + buysArray[i].allocatables }}));
      }

      if(sale.transactionType === "WITHDRAWAL" && buysArray[i].transactionType === "BEGHOLDINGS"){
        
        updatedBuysArray.push(BegHolding.updateOne({account: sale.transferAccount}, {$inc: {allocatables: -allocatableSales }}))

      } else if (allocatableSales !== 0 && sale.transactionType === "WITHDRAWAL") {

        var newBuy = new Buy({
          account: sale.transferAccount,
          tradeDate: sale.tradeDate,
          transactionType: 'BUY',
          quantity: allocatableSales,
          allocatables: allocatableSales,
          pricePerShare: buysArray[i].pricePerShare
        });

        updatedBuysArray.push(newBuy.saveAsync());

      }
    
      var newDura = new Dura({
        account: sale.account,
        tradeDate: buysArray[i].tradeDate,
        duraDate: sale.tradeDate,
        quantity: allocatableSales + buysArray[i].allocatables,
        pricePerShare: buysArray[i].pricePerShare
      });

      updatedBuysArray.push(newDura.saveAsync());

      allocatableSales = 0;

    }

  }

  return Promise.all(updatedBuysArray);

}

exports.resetAllocations = function(req, res){

  Buy.find({})
  .execAsync()
  .then(function(buys){
    return buys.forEach(function(elem){
      Buy.updateAsync({ _id: elem._id }, { $set: { allocatables: elem.quantity }})
    });
  })
  .then(function(){
    console.log("BUY ALLOCATIONS RESET");
  })
  .catch(function (err) {
   console.error(err); 
  })
  .done();

  BegHolding.find({})
  .execAsync()
  .then(function(begholdings){
    return begholdings.forEach(function(elem){
      BegHolding.updateAsync({ _id: elem._id }, { $set: { allocatables: elem.quantity }})
    })
  })
  .then(function(){
    console.log("BEGHOLDINGS ALLOCATIONS RESET");
  })
  .catch(function (err) {
   console.error(err); 
  })
  .done();

  Dura.removeAsync({})
  .then(function(){
    console.log("DURA COLLECTION CLEARED")
  })
  .catch(function (err) {
   console.error(err); 
 })
  .done();

}

exports.findSales = function(req, res){
  
  var stream = Sale.find({}, 'tradeDate allocatables account transferAccount', { tradeDate: 1, allocatables: 1, _id: 0 }).sort( { tradeDate: 1, allocatables: 1 } ).stream();

  stream.on('data', function(currentSale) {

  stream.pause();

  console.log("this is sale in the hopper: ", currentSale)
  
  BegHolding.findAllocatableBegHoldings(currentSale)
  .then(function(begAllocatables) {
    console.log("ONE - begAllocatables: ", begAllocatables)
    return Buy.findAllocatableBuys(begAllocatables, currentSale);
  })
  .then(function(buysArray){
    console.log("TWO - buysArray: ", buysArray)
    return allocateSale_FIFO(currentSale, buysArray);
  })
  .then(function(updatedBuysArray){
    console.log("THREE - updatedBuysArray: ", updatedBuysArray)
  })
  .then(function(){
    stream.resume();
  })
  .catch(function (err) {
   console.error(err); 
  })
  .done();

  })

  stream.on('error', function (err) {
    return handleError(res,err);
  })

  stream.on('close', function () {
    return res.end();
  })

}



// Get a single sale
exports.show = function(req, res) {
  Sale.findById(req.params.id, function (err, sale) {
    if(err) { return handleError(res, err); }
    if(!sale) { return res.send(404); }
    return res.json(sale);
  });
};

// Creates a new sale in the DB.
exports.create = function(req, res) {
  Sale.create(req.body, function(err, sale) {
    if(err) { return handleError(res, err); }
    return res.json(201, sale);
  });
};

// Updates an existing sale in the DB.
exports.update = function(req, res) {
  if(req.body._id) { delete req.body._id; }
  Sale.findById(req.params.id, function (err, sale) {
    if (err) { return handleError(res, err); }
    if(!sale) { return res.send(404); }
    var updated = _.merge(sale, req.body);
    updated.save(function (err) {
      if (err) { return handleError(res, err); }
      return res.json(200, sale);
    });
  });
};

// Deletes a sale from the DB.
exports.destroy = function(req, res) {
  Sale.findById(req.params.id, function (err, sale) {
    if(err) { return handleError(res, err); }
    if(!sale) { return res.send(404); }
    sale.remove(function(err) {
      if(err) { return handleError(res, err); }
      return res.send(204);
    });
  });
};

function handleError(res, err) {
  return res.send(500, err);
}