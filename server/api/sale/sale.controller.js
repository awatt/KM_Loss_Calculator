'use strict';

var _ = require('lodash');
var Sale = require('./sale.model');
var Buy = require('../buy/buy.model');
var Dura = require('../dura/dura.model');
var Total = require('../total/total.model');
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


function allocateSale_FIFO(currentSale, buysArray, classEndDate){

  // console.log("THIS IS TOTALS AT THE BEGINNING OF ALLOCATESALE_FIFO: ", totals)
  // console.log("this is the intended totals object by account: ", totals[currentSale.account])

  var updatedBuysArray = [], allocatableSales = currentSale.allocatables;

  if(currentSale.tradeDate <= classEndDate){
    var newTotal = new Total({
      account: currentSale.account,
      sales_class: -currentSale.quantity
    });
    updatedBuysArray.push(newTotal.saveAsync());
  }


  for (var i = 0, max = buysArray.length; i < max; i++){

    //if no allocatable sales remain, create held shares Dura object
    if (allocatableSales === 0){

      var newDura = new Dura({
        account: currentSale.account,
        tradeDate: buysArray[i].tradeDate,
        duraDate: currentSale.tradeDate,
        quantity: buysArray[i].allocatables,
        pricePerShare: buysArray[i].pricePerShare
      });

      updatedBuysArray.push(newDura.saveAsync());
    }


    //IF A GIVEN BUY OR BEGHOLDING IS ALLOCATED TO ZERO BY A SALE OR WITHDRAWAL
    if (allocatableSales !== 0 && allocatableSales + buysArray[i].allocatables <= 0){

      //FOR WITHDRAWALS ALLOCATED TO BEGHOLDINGS
      //transfer begholdings over to other accounts' begholdings and adjust quantity of both 
      //by remaining amount of source account's allocatables
      if(currentSale.transactionType === "WITHDRAWAL" && buysArray[i].transactionType === "BEGHOLDINGS"){
        
        //set transferor account's begholdings allocatables to zero decrement quantityAdjusted
        updatedBuysArray.push(BegHolding.findOneAndUpdateAsync({account: currentSale.account}, {$set: {allocatables: 0 }, $inc: {quantityAdjusted: -buysArray[i].allocatables} }))

        //increment transferee account's begholdings quantity and allocatables
        updatedBuysArray.push(BegHolding.findOneAndUpdateAsync({account: currentSale.transferAccount}, {$inc: {allocatables: buysArray[i].allocatables, quantityAdjusted: buysArray[i].allocatables }}));

      
      //FOR WITHDRAWALS ALLOCATED TO IN-CLASS BUYS  
      } else if (currentSale.transactionType === "WITHDRAWAL") {

        //decrement buy's quantity and allocatables
        updatedBuysArray.push(Buy.findByIdAndUpdateAsync(buysArray[i]._id, {$set: {allocatables: 0 }, $inc: {quantityAdjusted: -buysArray[i].allocatables} }));

        //insert new buy into transferee account for the number of shares allocated
        var newBuy = new Buy({
          account: currentSale.transferAccount,
          tradeDate: currentSale.tradeDate,
          transactionType: 'BUY',
          quantity: buysArray[i].allocatables,
          quantityAdjusted: buysArray[i].allocatables,
          allocatables: buysArray[i].allocatables,
          pricePerShare: buysArray[i].pricePerShare
        });

        updatedBuysArray.push(newBuy.saveAsync().then(function(newBuy){ console.log("this is a newBuy inserted into transfer account: ", newBuy)}));

      //FOR SALES ALLOCATED TO BEGHOLDINGS
      //decrement the allocatables for both the sale and matched begholdings by remaining amount of begholding's allocatables
      } else if(buysArray[i].transactionType === "BEGHOLDINGS"){
        updatedBuysArray.push(BegHolding.findByIdAndUpdateAsync(buysArray[i]._id, { $set: { allocatables: 0 }}));
      
      //FOR SALES ALLOCATED TO BUYS
      } else {
        //set the allocatables of the matched buy to zero
        updatedBuysArray.push(Buy.findByIdAndUpdateAsync(buysArray[i]._id, { $set: { allocatables: 0 }}));

        //update in-class and 90-day totals by the remaining amount of the buy's allocatables
        if(currentSale.tradeDate <= classEndDate){
          var newTotal = new Total({
            account: currentSale.account,
            sales_classAllocated: buysArray[i].allocatables,
            proceeds_class: buysArray[i].allocatables*buysArray[i].pricePerShare
          });
          updatedBuysArray.push(newTotal.saveAsync());
        } else {
          var newTotal = new Total({
            account: currentSale.account,
            sales_90Day: buysArray[i].allocatables,
            proceeds_90Day: buysArray[i].allocatables*buysArray[i].pricePerShare
          });
          updatedBuysArray.push(newTotal.saveAsync());
        }
      }
      //increment sale allocations by the remaining amount of buy's allocatables
      allocatableSales += buysArray[i].allocatables;
    }


    //IF A GIVEN BUY OR BEGHOLDING IS PARTIALLY ALLOCATED TO A GIVEN SALE OR WITHDRAWAL
    if (allocatableSales !== 0 && allocatableSales + buysArray[i].allocatables > 0){

      //FOR WITHDRAWALS ALLOCATED TO BEGHOLDINGS
      //transfer begholdings over to other accounts' begholdings and adjust quantity of both 
      //by remaining amount of source account's allocatables
      if(currentSale.transactionType === "WITHDRAWAL" && buysArray[i].transactionType === "BEGHOLDINGS"){
        
        //decrement transferor account's begholdings quantity and allocatables by the amount of sale's remaining allocatables
        updatedBuysArray.push(BegHolding.findOneAndUpdateAsync({account: currentSale.account}, {$inc: {allocatables: allocatableSales, quantityAdjusted: allocatableSales }}))

        //increment transferee account's begholdings quantity and allocatables
        updatedBuysArray.push(BegHolding.findOneAndUpdateAsync({account: currentSale.transferAccount}, {$inc: {allocatables: -allocatableSales, quantityAdjusted: -allocatableSales }}));

      
      //FOR WITHDRAWALS ALLOCATED TO IN-CLASS BUYS  
      } else if (currentSale.transactionType === "WITHDRAWAL") {

        //decrement buy's quantity and allocatables by remaining amount of sale's allocatables
        updatedBuysArray.push(Buy.findByIdAndUpdateAsync(buysArray[i]._id, {$inc: {allocatables: allocatableSales, quantityAdjusted: allocatableSales }}));

        //insert new buy into transferee account for the number of shares allocated
        var newBuy = new Buy({
          account: currentSale.transferAccount,
          tradeDate: currentSale.tradeDate,
          transactionType: 'BUY',
          quantity: -allocatableSales,
          quantityAdjusted: -allocatableSales,
          allocatables: -allocatableSales,
          pricePerShare: buysArray[i].pricePerShare
        });

        updatedBuysArray.push(newBuy.saveAsync().then(function(newBuy){ console.log("this is a newBuy inserted into transfer account: ", newBuy)}));

      //FOR SALES ALLOCATED TO BEGHOLDINGS
      //decrement the allocatables for the matched begholdings by remaining amount of sale's allocatables
      } else if(buysArray[i].transactionType === "BEGHOLDINGS"){
        updatedBuysArray.push(BegHolding.findByIdAndUpdateAsync(buysArray[i]._id, { $inc: { allocatables: allocatableSales }}));
      
      //FOR SALES ALLOCATED TO BUYS
      } else {
        //decrement the allocatables of the matched buy by the remaining amount of sale's allocatables
        updatedBuysArray.push(Buy.findByIdAndUpdateAsync(buysArray[i]._id, { $inc: { allocatables: allocatableSales }}));

        //create new Dura object for remaining held buys
        var newDura = new Dura({
          account: currentSale.account,
          tradeDate: buysArray[i].tradeDate,
          duraDate: currentSale.tradeDate,
          quantity: allocatableSales + buysArray[i].allocatables,
          pricePerShare: buysArray[i].pricePerShare
        });

        updatedBuysArray.push(newDura.saveAsync());

          //update in-class and 90-day totals by the remaining amount of the buy's allocatables
        if(currentSale.tradeDate <= classEndDate){
          var newTotal = new Total({
            account: currentSale.account,
            sales_classAllocated: -currentSale.allocatables,
            proceeds_class: -currentSale.allocatables*buysArray[i].pricePerShare
          });
          updatedBuysArray.push(newTotal.saveAsync());
        } else {
          var newTotal = new Total({
            account: currentSale.account,
            sales_90Day: -currentSale.allocatables,
            proceeds_90Day: -currentSale.allocatables*buysArray[i].pricePerShare
          });
          updatedBuysArray.push(newTotal.saveAsync());
        }
      }

      //increment sale allocations by the remaining amount of buy's allocatables
      allocatableSales = 0;
    }
      // console.log("THIS IS TOTALS AT THE END OF ALLOCATESALE_FIFO LOOP: ", totals)
  } //end of loop

    // console.log("THIS IS TOTALS AT THE VERY END OF ALLOCATESALE_FIFO: ", totals)

  return Promise.all(updatedBuysArray);

}
    
// var sumClassBuys = _.once(function(buysArray, totals, currentSale, classEndDate){
//   for (var i = 0, max = buysArray.length; i < max; i++){
//     if (buysArray[i].tradeDate <= classEndDate && buysArray[i].transactionType !== "BEGHOLDINGS"){
//       totals[currentSale.account].buys_class += buysArray[i].quantityAdjusted;
//       totals[currentSale.account].expenditures_class += buysArray[i].quantityAdjusted*buysArray[i].pricePerShare;
//     }
//   }
// });

exports.resetAllocations = function(req, res){

  Buy.find({})
  .execAsync()
  .then(function(buys){
    return buys.forEach(function(elem){
      Buy.updateAsync({ _id: elem._id }, { $set: { allocatables: elem.quantity, quantityAdjusted: elem.quantity }})
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
      BegHolding.updateAsync({ _id: elem._id }, { $set: { allocatables: elem.quantity, quantityAdjusted: elem.quantity }})
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

  Total.removeAsync({})
  .then(function(){
    console.log("TOTAL COLLECTION CLEARED")
  })
  .catch(function (err) {
   console.error(err); 
 })
  .done();

}

exports.allocateSales = function(req, res){

  //req.body for production
  var classEndDate = "2014,11,14";
  
  var stream = Sale.find({}, 'tradeDate allocatables account transferAccount quantity pricePerShare transactionType', { tradeDate: 1, allocatables: 1, _id: 0 }).sort( { tradeDate: 1, allocatables: 1 } ).stream();

  stream.on('data', function(currentSale) {

    stream.pause();

    console.log("this is sale in the hopper: ", currentSale)

    BegHolding.findAllocatableBegHoldings(currentSale)
    .then(function(begAllocatables) {
      // console.log("ONE - begAllocatables: ", begAllocatables)
      return Buy.findAllocatableBuys(begAllocatables, currentSale);
    })
    .then(function(buysArray){
      // console.log("TWO - buysArray: ", buysArray)

      // if(currentSale > classEndDate){
      //   sumClassBuys(buysArray, totals, currentSale, classEndDate);
      // };
      return allocateSale_FIFO(currentSale, buysArray, classEndDate);
     })
    .then(function(updatedBuysArray){
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