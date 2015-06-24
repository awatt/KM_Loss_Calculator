'use strict';

var _ = require('lodash');
var Sale = require('./sale.model');
var Buy = require('../buy/buy.model');
var mongoose = require('mongoose'),
    mongooseQ = require('mongoose-q')(mongoose)

// Get list of sales
exports.index = function(req, res) {
  Sale.find(function (err, sales) {
    if(err) { return handleError(res, err); }
    return res.json(200, sales);
  });
};


// var findBuys = function(account, saleDate){


// // var returnValue = Buy.find({ account: account, tradeDate: { $lte: saleDate }, allocatables: { $gt: 0 } }).sort( { tradeDate: 1, allocatables: -1 } ).limit(1);

// return Buy.nextBuyToAllocate(account, saleDate);

// }

exports.findSales = function(req, res){
  console.log("got to findSales")

  var stream = Sale.find({}, 'tradeDate allocatables account', { tradeDate: 1, allocatables: 1, _id: 0 }).sort( { tradeDate: 1, allocatables: 1 } ).stream();

  stream.on('data', function(doc) {

  stream.pause();

  //get next buy to allocate using async promise
//get list of artist names by keyword search

  Buy.find({}, 'tradeDate allocatables account', { tradeDate: 1, allocatables: -1, _id: 0 })
  .sort( { tradeDate: 1, allocatables: -1 } )
  .limit(1)
  .where('account', doc.account)
  .where('tradeDate').lte(doc.tradeDate)
  .where('allocatables').gt(0)
  .execQ()
  .then(function (data) {
  

  //do sychronous allocation stuff here and save
  console.log('this is the sale in the hopper:', doc.account +" "+ doc.tradeDate +" "+ doc.allocatables)
  console.log('this is the buydata returned from the find query:', data)
  // console.log('this is the buy for allocating:', data[0].account +" "+ data[0].tradeDate +" "+ data[0].allocatables)

  })
  .then(function(){
    stream.resume();
  })
  .catch(function (err) {
   console.error(err); 
  })
  .done();

  

  // console.log(nextBuy.account +" "+ nextBuy.tradeDate +" "+ nextBuy.allocatables)
  

  
    // return res.write('200', doc);
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