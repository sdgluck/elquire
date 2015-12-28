'use strict';

var expect = require('expect');
var catchAndMatch = require('catch-and-match');

describe('elquire', function () {

    // Store result of calls to elquire so that we can unload after each test
    var result;

    var expectedOutput = 'testModuleOne testModuleTwo';

    var transformedEs6 = [
        "import './one/two/three/testModuleOne.js';",
        "import testModuleTwo from './four/five/six/testModuleTwo.js';",
        "import obj from './one/two/three/testModuleOne.js';",
        "import { obj1, obj2 } from './four/five/six/testModuleTwo.js';"
    ];

    var badDefinitions = {
        tab: 'elquire.Bad\tDefinition.tab',
        space: 'elquire.Bad Definition.space'
    };

    var badOptions = ['namespace', 'name', 'ignore', 'path'];

    this.timeout(4000);

    afterEach(function () {
        if (result && result.elquire) {
            var path = require.resolve('../index.js');
            delete require.cache[path];
            result.elquire.unload();
        }
    });

    it('should transform CommonJS import statements', function () {
        result = entry('CommonJS');
        expect(result.value).toEqual(expectedOutput);
    });

    it('should transform ES6 import statements', function () {
        // Node doesn't yet support the ES6 import system. Instead we can check that
        // elquire can correctly transforms strings containing some import statements.
        result = require('./ES6/es6Entry.js');
        expect(result.value).toEqual(transformedEs6);
    });

    it('should not inhibit other transformers (babel/register)', function () {
        result = require('./ES6/babelEntry.js');
        expect(result.value).toEqual(expectedOutput);
    });

    it('should allow invocation without options', function () {
        result = entry('WithoutOptions');
        expect(result.elquire.modules.has('elquire.WithoutOptions.module')).toExist();
    });

    it('should apply namespace option at runtime', function () {
        result = require('./WithOptions/Namespace/string.js');
        expect(result.elquire.modules.has('elquire.WithOptions.module')).toExist();
    });

    it('should apply options object at runtime', function () {
        result = require('./WithOptions/Namespace/object.js');
        expect(result.elquire.modules.has('elquire.WithOptions.module')).toExist();
    });

    it('should error when a module name is used more than once', function () {
        var fn = entryFn('Duplicate');
        var errRe = /module name 'elquire.Duplicate.module' is already registered/;
        return catchAndMatch(fn, errRe);
    });

    it('should error when a module is defined without the given namespace', function () {
        var fn = entryFn('BadName/Namespace');
        var errRe = /does not have namespace/;
        return catchAndMatch(fn, errRe);
    });

    it('should error when a module does not satisfy the given regular expression', function () {
        var fn = entryFn('BadName/Regex');
        var errRe = /does not satisfy regex/;
        return catchAndMatch(fn, errRe);
    });

    it('should error for incorrect option types', function (cb) {
        badOptions.forEach(function each (name, i) {
            try {
                if (each.stop) return;
                require('./_isolated')({[name]: -1});
                cb(new Error(`did not error for bad '${name}' option`));
                each.stop = true;
            } catch (err) {
                if (i + 1 === badOptions.length) {
                    cb();
                }
            }
        });
    });

    it('should not register a module that has a broken definition', function (cb) {
        var keys = Object.keys(badDefinitions);
        var result = entry('BadDefinition');
        keys.forEach(function (name, i) {
            var moduleName = badDefinitions[name];
            expect(result.elquire.modules.has(moduleName), moduleName).toNotExist();
            if (i + 1 === keys.length) {
                cb();
            }
        });
    });

    it('should not register modules that exist within an ignored folder', function () {
        result = entry('WithOptions/Ignore');
        expect(result.elquire.modules.has('elquire.WithOptions.ignoredModule')).toNotExist();
        expect(result.elquire.modules.has('elquire.WithOptions.hiddenModule')).toNotExist();
        expect(result.elquire.modules.has('elquire.WithOptions.nodeModule')).toNotExist();
    });

    it('should not register modules outside of given path', function () {
        result = entry('WithOptions/Path');
        expect(result.elquire.modules.has('elquire.WithOptions.inPath')).toNotExist();
        expect(result.elquire.modules.has('elquire.WithOptions.outsidePath')).toNotExist();
    });

    function entry (path) {
        return require(`./${path}/entry.js`);
    }

    function entryFn(path) {
        return function () {
            return entry(path);
        };
    }
});
