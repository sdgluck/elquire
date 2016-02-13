'use strict'

var expect = require('expect')
var catchAndMatch = require('catch-and-match')

describe('elquire', function () {
  function entry (path) {
    return require(`./${path}/entry.js`)
  }

  function entryFn (path) {
    return function () {
      return entry(path)
    }
  }

  // Store result of calls to elquire so that we can unload after each test
  var result

  var expectedCommonJsModules = [
    'elquire.CommonJS.testModuleTwo',
    'elquire.CommonJS.testModuleOne',
    'elquire.CommonJS.testModuleZero'
  ];

  var expectedEs6Modules = [
    'elquire.ES6.testModuleTwo',
    'elquire.ES6.testModuleOne'
  ]

  var transformedEs6 = [
    "import './one/two/three/testModuleOne.js'",
    "import testModuleTwo from './four/five/six/testModuleTwo.js'",
    "import obj from './one/two/three/testModuleOne.js'",
    "import { obj1, obj2 } from './four/five/six/testModuleTwo.js'"
  ]

  var badDefinitions = {
    tab: 'elquire.Bad\tDefinition.tab',
    space: 'elquire.Bad Definition.space'
  }

  var optionNames = [
    'namespace',
    'name',
    'ignore',
    'path'
  ]

  // Give time for babel require hook to do its thing
  this.timeout(10000)

  beforeEach(function () {
    if (result && result.elquire) {
      delete require.cache[require.resolve('../index.js')]
      delete require.cache[require.resolve('../elquire.js')]
      result.elquire.unload()
    }
  })

  it('should transform CommonJS import statements', function () {
    result = entry('CommonJS')
    expect(Object.keys(result.elquire.modules)).toEqual(expectedCommonJsModules)
  })

  it('should transform ES6 import statements', function () {
    // Node doesn't yet support the ES6 import system. Instead we can check that
    // elquire can correctly transforms strings containing some import statements.
    result = require('./ES6/es6Entry.js')
    expect(result.value).toEqual(transformedEs6)
  })

  it('should not inhibit babel-register', function () {
    result = require('./ES6/babelEntry.js')
    expect(Object.keys(result.elquire.modules)).toEqual(expectedEs6Modules)
  })

  it('should apply namespace option', function () {
    result = require('./WithOptions/Namespace/string.js')
    expect(result.elquire.modules['elquire.WithOptions.module']).toExist()
  })

  it('should apply options object', function () {
    result = require('./WithOptions/Namespace/object.js')
    expect(result.elquire.modules['elquire.WithOptions.module']).toExist()
  })

  it('should error when a module name is used more than once', function () {
    var fn = entryFn('Duplicate')
    var errRe = /module name 'elquire.Duplicate.module' is already registered/
    return catchAndMatch(fn, errRe)
  })

  it('should error when a module is defined without the given namespace', function () {
    var fn = entryFn('BadName/Namespace')
    var errRe = /does not have namespace/
    return catchAndMatch(fn, errRe)
  })

  it('should error when a module does not satisfy the given regular expression', function () {
    var fn = entryFn('BadName/Regex')
    var errRe = /does not satisfy regex/
    return catchAndMatch(fn, errRe)
  })

  it('should error for incorrect option types', function (cb) {
    for (var i = 0; i < optionNames.length; i++) {
      var name = optionNames[i]
      try {
        require('./_isolated')({[name]: -1})
        cb(new Error(`did not error for bad '${name}' option`))
        return
      } catch (err) {
        if (i + 1 === optionNames.length) {
          cb()
        }
      }
    }
  })

  it('should not register a module that has a broken definition', function (cb) {
    var keys = Object.keys(badDefinitions)
    var result = entry('BadDefinition')
    keys.forEach(function (name, i) {
      var moduleName = badDefinitions[name]
      expect(result.elquire.modules[moduleName]).toNotExist()
      if (i + 1 === keys.length) {
        cb()
      }
    })
  })

  it('should not register modules that exist within an ignored folder', function () {
    result = entry('WithOptions/Ignore')
    expect(result.elquire.modules['elquire.WithOptions.ignoredModule']).toNotExist()
    expect(result.elquire.modules['elquire.WithOptions.hiddenModule']).toNotExist()
    expect(result.elquire.modules['elquire.WithOptions.nodeModule']).toNotExist()
  })

  it('should not register modules outside of given path', function () {
    result = entry('WithOptions/Path')
    expect(result.elquire.modules['elquire.WithOptions.inPath']).toExist()
    expect(result.elquire.modules['elquire.WithOptions.outsidePath']).toNotExist()
  })
})
