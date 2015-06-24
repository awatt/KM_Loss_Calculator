'use strict';

var mongoose = require('mongoose'),
Schema = mongoose.Schema;

var TradeSchema = new Schema({
	account: String,
	tradeDate: String,
	transactionType: String,
	quantity: Number,
	allocatables: Number,
	pricePerShare: Number
});

TradeSchema.index({ transactionType: 1, tradeDate: -1 }); 



module.exports = mongoose.model('Trade', TradeSchema);