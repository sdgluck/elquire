'use strict';

if (!module.parent) {
    throw new Error('elquire should be required within a module');
}

if (global.__elquire) {
    throw new Error('only one instance of elquire is allowed');
}
global.__elquire = true;

module.exports = require('./elquire');
