'use strict';

// var mongoose = require('mongoose'),
//     Schema = mongoose.Schema;

var mongoose = require('mongoose'),
    mongooseQ = require('mongoose-q')(mongoose),
    Schema = mongoose.Schema;

var BuySchema = new Schema({
	account: String,
	tradeDate: String,
	transactionType: String,
	quantity: Number,
	allocatables: Number,
	pricePerShare: Number
});

BuySchema.index({ tradeDate: 1, allocatables: -1 });

//gets carts by user
// BuySchema.statics.nextBuyToAllocate = function(account, saleDate, cb){
// 	console.log("GOT INTO nextBuyToAllocate")
//   return this.find({}, 'tradeDate allocatables account')
//         .where('account', account)
//         .where('tradeDate').lte(saleDate)
//         .where('allocatables').gt(0)
//         .sort( { tradeDate: 1, allocatables: -1 } )
//         .limit(1)
//         .exec(cb);
// } 

// Sale.find({}, 'tradeDate allocatables account', { tradeDate: 1, allocatables: 1, _id: 0 }).sort( { tradeDate: 1, allocatables: 1 } ).stream();

module.exports = mongoose.model('Buy', BuySchema);