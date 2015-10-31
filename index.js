'use strict';

if (!module.parent) {
    throw err('elquire should be instantiated within a file');
}

let fs = require('fs');
let path = require('path');

const declaration_Re = /^\/\/\/\s*<module name=["'`]?([^"'` \n\t\r\0]+)["'`]?>$/im;
const commonJs_Re = /require\(["'`]([^"'`\n\t\r\0]+)["'`]\)/g;
const es6_Re = /import(?:.+[.+]? from)? ["'`]([^"'`\n\t\r\0]+)["'`]/g;

const optionValidators = {
    namespace: (v) => typeof v === 'string',
    name: (v) => v instanceof RegExp,
    ignore: (v) => Array.isArray(v),
    path: (v) => typeof v === 'string'
};

const moduleValidators = {
    namespace: {
        fn: (m, v) => m.name.indexOf(v) === 0,
        err: "module '{{name}}' does not have namespace '{{expected}}'"
    },
    name: {
        fn: (m, v) => v.test(m),
        err: "module '{{name}}' does not satisfy regex '{{expected}}'"
    }
};

let err = (msg) => new Error(`elquire: ${msg}`);
let options = defaultOptions();
let modules = buildModuleMap(new Map(), options.path);
let oldLoader;

registerLoader();

function registerLoader () {
    oldLoader = require.extensions['.js'];
    require.extensions['.js'] = function (m, filename) {
        let compile = m._compile.bind(m);
        m._compile = (content) => {
            content = transform(filename, content);
            compile(content, filename);
        };
        oldLoader(m, filename);
    };
}

function defaultOptions () {
    return {
        path: path.dirname(module.parent.filename),
        ignore: ['node_modules', /^\./]
    };
}

function unload () {
    require.extensions['.js'] = oldLoader;
}

/**
 * Determine if a file or folder should be ignored.
 * @param {String} dir
 * @returns {Boolean}
 */
function shouldIgnore (dir) {
    let abs = path.resolve(options.path, dir);
    let name = path.basename(abs);
    for (let i = 0; i < options.ignore.length; i++) {
        let val = options.ignore[i];
        if (typeof val === 'string') {
            let absVal = path.resolve(options.path, val);
            if (abs === absVal) {
                return true;
            }
        } else if (val instanceof RegExp) {
            if (val.test(name)) {
                return true;
            }
        }
    }
    return false;
}

/**
 * Identify all elquire module definitions within `dir`.
 * @param {Map} modules
 * @param {Object} dir
 * @returns {Object}
 */
function buildModuleMap (modules, dir) {
    fs.readdirSync(dir).forEach(function (file) {
        let moduleDir = path.join(dir, file);
        let isDir = fs.statSync(moduleDir).isDirectory();
        let ignore = shouldIgnore(dir);
        if (isDir && !ignore) {
            buildModuleMap(modules, moduleDir);
        } else if (!ignore) {
            let obj = moduleDefinition(moduleDir);
            if (obj && !modules.has(obj.name)) {
                isValidModuleDefinition(obj);
                modules.set(obj.name, moduleDir);
            } else if (obj) {
                throw err(`module name '${obj.name}' is already registered`);
            }
        }
    });
    return modules;
}

/**
 * Identify and generate a module definition for a file.
 * @param {String} filename
 * @returns {Object}
 */
function moduleDefinition (filename) {
    let content = fs.readFileSync(filename, 'utf-8');
    let match = declaration_Re.exec(content);
    if (match) {
        return {name: match[1]};
    }
}

/**
 * Check that a module definition is valid against the
 * requirements defined in the `options` object.
 * @param {Object} m
 */
function isValidModuleDefinition (m) {
    let names = Object.keys(moduleValidators);
    for (let i = 0; i < names.length; i++) {
        let name = names[i];
        if (name in options) {
            let value = options[name];
            let validator = moduleValidators[name];
            if (!validator.fn(m, value)) {
                let msg = validator.err
                    .replace('{{name}}', m.name)
                    .replace('{{expected}}', value.toString());
                throw err(msg);
            }
        }
    }
    return true;
}

function isValidOptions (opts) {
    let names = Object.keys(opts);
    for (let i = 0; i < names.length; i++) {
        let name = names[i];
        if (name in optionValidators) {
            let value = opts[name];
            let validator = optionValidators[name];
            if (!validator(value)) {
                throw err(`invalid value for option '${name}': ${value}`);
            }
        }
    }
    return true;
}

/**
 * Find elquire module names within a file and replace them with a
 * relative path from the current file to where the file exists.
 * @param {String} file
 * @param {String} content
 * @returns {String}
 */
function transform (file, content) {
    [es6_Re, commonJs_Re].forEach(function (re) {
        let match;
        while ((match = re.exec(content)) != null) {
            let moduleName = match[1];
            if (modules.has(moduleName)) {
                let modulePath = modules.get(moduleName);
                let fromDir = path.dirname(file);
                let toDir = path.dirname(modulePath);
                let relativePath = path.relative(fromDir, toDir).replace(/[\\]/g, '/');
                let index = match.index + match[0].indexOf(match[1]);
                let contentStart = content.substr(0, index);
                let contentEnd = content.substr(index + moduleName.length, content.length);
                relativePath = ['.', relativePath, path.basename(modulePath)].join('/');
                content = contentStart + relativePath + contentEnd;
            }
        }
    });
    return content;
}

function extend (opts) {
    Object.keys(opts).forEach(function (name) {
        if (name === 'ignore') {
            options.ignore = options.ignore.concat(opts[name]);
        } else if (name === 'path') {
            options.path = path.resolve(options.path, opts.path);
        } else {
            options[name] = opts[name];
        }
    });
}

function initialise (opts) {
    if (typeof opts === 'string') {
        options.namespace = opts;
    } else if (typeof opts === 'object') {
        options = defaultOptions();
        isValidOptions(opts);
        extend(opts);
    }
    modules = buildModuleMap(new Map(), options.path);
    return {
        _unload: unload,
        _modules: modules
    };
}

module.exports = initialise;
module.exports._unload = unload;
module.exports._modules = modules;
