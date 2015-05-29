'use strict';

describe('Service: linkedList', function () {

  // load the service's module
  beforeEach(module('kmLossCalculatorApp'));

  // instantiate service
  var linkedList;
  beforeEach(inject(function (_linkedList_) {
    linkedList = _linkedList_;
  }));

  it('should do something', function () {
    expect(!!linkedList).toBe(true);
  });

});
