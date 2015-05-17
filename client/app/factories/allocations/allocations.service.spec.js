'use strict';

describe('Service: allocations', function () {

  // load the service's module
  beforeEach(module('kmLossCalculatorApp'));

  // instantiate service
  var allocations;
  beforeEach(inject(function (_allocations_) {
    allocations = _allocations_;
  }));

  it('should do something', function () {
    expect(!!allocations).toBe(true);
  });

});
