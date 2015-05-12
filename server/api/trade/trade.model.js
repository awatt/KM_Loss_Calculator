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


// {  
//    "_id":ObjectId("5551184da767d03bf16bed72"),
//    "securityType":"ISIN",
//    "securityID":"US71654V4086",
//    "securityDescription":"PETROLEO BRASILEIRO-SPON ADR",
//    "account":"Account 1",
//    "tradeDate":"6/30/10",
//    "valueDate":"7/6/10",
//    "transactionType":"BUY",
//    "quantity":"2,600.00",
//    "pricePerShare":34.4,
//    "mVofTrade":"89,431.34",
//    "currency":"USD"
// }
