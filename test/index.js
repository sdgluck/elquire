'use strict';

let assert = require('chai').assert;

describe('elquire', function () {

    // Store result of calls to elquire so that we can unload after each test
    let result;

    let expectedOutput = 'testModuleOne testModuleTwo';

    let transformedEs6 = [
        "import './one/two/three/testModuleOne.js';",
        "import testModuleTwo from './four/five/six/testModuleTwo.js';",
        "import obj from './one/two/three/testModuleOne.js';",
        "import { obj1, obj2 } from './four/five/six/testModuleTwo.js';"
    ];
    let badDefinitions = {
        tab: 'elquire.Bad\tDefinition.tab',
        space: 'elquire.Bad Definition.space'
    };
    let badOptions = ['namespace', 'name', 'ignore', 'path'];

    this.timeout(4000);

    afterEach(function () {
        if (result && result.elquire) {
            let path = require.resolve('../index.js');
            delete require.cache[path];
            result.elquire._unload();
        }
    });

    it('should transform CommonJS import statements', function () {
        result = entry('CommonJS');
        assert.equal(result.value, expectedOutput);
    });

    it('should transform ES6 import statements', function () {
        // Node doesn't yet support the ES6 import system. Instead we can check that
        // elquire can correctly transforms strings containing some import statements.
        result = require('./ES6/es6Entry.js');
        assert.deepEqual(result.value, transformedEs6);
    });

    it('should not inhibit other transformers (babel/register)', function () {
        result = require('./ES6/babelEntry.js');
        assert.equal(result.value, expectedOutput);
    });

    it('should allow invocation without options', function () {
        result = entry('WithoutOptions');
        assert.isTrue(result.elquire._modules.has('elquire.WithoutOptions.module'));
    });

    it('should apply namespace option at runtime', function () {
        result = require('./WithOptions/Namespace/string.js');
        assert.isTrue(result.elquire._modules.has('elquire.WithOptions.module'));
    });

    it('should apply options object at runtime', function () {
        result = require('./WithOptions/Namespace/object.js');
        assert.isTrue(result.elquire._modules.has('elquire.WithOptions.module'));
    });

    it('should error when a module name is used more than once', function (cb) {
        let fn = entryFn('Duplicate');
        let errRe = /module name 'elquire.Duplicate.module' is already registered/;
        catchAndMatch(fn, errRe, cb);
    });

    it('should error when a module is defined without the given namespace', function (cb) {
        let fn = entryFn('BadName/Namespace');
        let errRe = /does not have namespace/;
        catchAndMatch(fn, errRe, cb);
    });

    it('should error when a module does not satisfy the given regular expression', function (cb) {
        let fn = entryFn('BadName/Regex');
        let errRe = /does not satisfy regex/;
        catchAndMatch(fn, errRe, cb);
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
        let keys = Object.keys(badDefinitions);
        let result = entry('BadDefinition');
        keys.forEach(function (name, i) {
            let moduleName = badDefinitions[name];
            assert.isFalse(result.elquire._modules.has(moduleName), moduleName);
            if (i + 1 === keys.length) {
                cb();
            }
        });
    });

    it('should not register modules that exist within an ignored folder', function () {
        result = entry('WithOptions/Ignore');
        assert.isFalse(result.elquire._modules.has('elquire.WithOptions.ignoredModule'));
        assert.isFalse(result.elquire._modules.has('elquire.WithOptions.hiddenModule'));
        assert.isFalse(result.elquire._modules.has('elquire.WithOptions.nodeModule'));
    });

    it('should not register modules outside of given path', function () {
        result = entry('WithOptions/Path');
        assert.isTrue(result.elquire._modules.has('elquire.WithOptions.inPath'));
        assert.isFalse(result.elquire._modules.has('elquire.WithOptions.outsidePath'));
    });

    function catchAndMatch (fn, re, cb) {
        try {
            fn();
            cb(new Error('no error thrown'));
        } catch (err) {
            assert.match(err.message, re);
            cb();
        }
    }

    function entry (path) {
        return require(`./${path}/entry.js`);
    }

    function entryFn(path) {
        return function () {
            return entry(path);
        };
    }
});
