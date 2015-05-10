'use strict';

describe('Service: trades', function () {

  // load the service's module
  beforeEach(module('kmLossCalculatorApp'));

  // instantiate service
  var trades;
  beforeEach(inject(function (_trades_) {
    trades = _trades_;
  }));

  it('should do something', function () {
    expect(!!trades).toBe(true);
  });

});
