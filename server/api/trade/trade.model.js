'use strict';

var mongoose = require('mongoose'),
Schema = mongoose.Schema;

var TradeSchema = new Schema({
	securityType: String,
	securityID: String,
	securityDescription: String,
	account: String,
	tradeDate: String,
	valueDate: String,
	transactionType: String,
	quantity: Number,
	pricePerShare: Number,
	mVofTrade: Number,
	currency: String,
	holdingType: String
});

module.exports = mongoose.model('Trade', TradeSchema);