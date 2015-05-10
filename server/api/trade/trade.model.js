'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var TradeSchema = new Schema({
  name: String,
  info: String,
  active: Boolean
});

module.exports = mongoose.model('Trade', TradeSchema);