/// <module name="elquire.CommonJS.testModuleOne">

// Require an elquire module that is 'up then down' the directory tree
var testModuleTwo = require('elquire.CommonJS.testModuleTwo');

module.exports = 'testModuleOne ' + testModuleTwo;
