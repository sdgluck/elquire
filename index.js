'use strict';

if (!module.parent) {
  throw new Error('Expected elquire to be required within a module');
}

if (global.__elquire) {
  throw new Error('Only one instance of elquire should be created');
}
global.__elquire = true;

module.exports = require('./elquire').default;