'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var TotalSchema = new Schema({
    account: String,
    buys_class: Number,
    expenditures_class: Number,
    sales_class: Number,
    sales_classAllocated: Number,
    proceeds_class: Number,
    sales_90Day: Number, 
    proceeds_90Day: Number //need avg prices from elaine
  });

module.exports = mongoose.model('Total', TotalSchema);