'use strict';

/// <module name="elquire.ES6.testModuleOne">

// Require an elquire module that is 'up then down' the directory tree
import testModuleTwo from 'elquire.ES6.testModuleTwo';

export default 'testModuleOne ' + testModuleTwo;
