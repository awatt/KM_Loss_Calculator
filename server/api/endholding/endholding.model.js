'use strict';

var mongoose = require('mongoose'),
    Schema = mongoose.Schema;

var EndholdingSchema = new Schema({
  name: String,
  info: String,
  active: Boolean
});

module.exports = mongoose.model('Endholding', EndholdingSchema);