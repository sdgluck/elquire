'use strict'

import fs from 'fs'
import path from 'path'
import finder from 'find-package-json'

export default function (userOpts) {
  // ---
  // Constants
  // ---

  const REGEX = {
    /**
     * Find an elquire module definition.
     * e.g. `<module name=namespace.moduleName>`
     */
    declaration: /^\/\/\/\s*<module name=["'`]?([^"'` \n\t\r\0]+)["'`]?>$/im,

    /**
     * Find a CommonJS require statement.
     * e.g. `require('fs')`
     */
    commonJs: /require\(["'`]([^"'`\n\t\r\0]+)["'`]\)/g,

    /**
     * Find an ES6 import statement.
     * e.g. `import fs from 'fs'`, `import 'fs'`, `import { method } from 'fs'`
     */
    es6: /import(?:.+[.+]? from)? ["'`]([^"'`\n\t\r\0]+)["'`]/g
  }

  /**
   * Methods to ensure the correct type of data is given by user.
   * Each user option will be run through the corresponding option validator.
   */
  const OPTION_VALIDATORS = {
    namespace: (v) => typeof v === 'string',
    name: (v) => v instanceof RegExp,
    ignore: (v) => Array.isArray(v),
    path: (v) => typeof v === 'string'
  }

  /**
   * Methods to validate an elquire module declaration, and a string template for
   * each that is output when the declaration does not satisfy a validation.
   */
  const MODULE_VALIDATORS = {
    namespace: {
      fn: (m, v) => m.name.indexOf(v) === 0,
      msg: "module '{{name}}' does not have namespace '{{expected}}'"
    },
    name: {
      fn: (m, v) => v.test(m),
      msg: "module '{{name}}' does not satisfy regex '{{expected}}'"
    }
  }

  // The path elquire was invoked from
  const REQUIRE_PATH = path.dirname(module.parent.parent.filename)

  const DEFAULT_IGNORE = [
    'node_modules',
    /^\./
  ]

  // ---
  // State
  // ---

  const oldLoader = require.extensions['.js']

  const packageJson = finder().next()

  if (packageJson.value && packageJson.value.elquire) {
    if (userOpts) {
      warn('package.json "elquire" configuration object will override options argument')
    }
    userOpts = packageJson.elquire
  }

  const options = extend(userOpts)

  const modules = buildModules({}, options.path)

  // ---
  // Require hook
  // ---

  require.extensions['.js'] = function (m, filename) {
    let compile = m._compile.bind(m)
    m._compile = (content) => {
      content = transform(filename, content)
      compile(content, filename)
    }
    oldLoader(m, filename)
  }

  // ---
  // Utility
  // ---

  /**
   * Create a namespaced error message.
   * @param {String} msg
   * @returns {Error}
   */
  function err (msg) {
    return new Error(`elquire: ${msg}`)
  }

  /**
   * Log a message to `console`.
   * @param {String} msg
   */
  function warn (msg) {
    console.log('\x1b[33m', `elquire: ${msg}`, '\x1b[37m')
  }

  // ---
  // Elquire
  // ---

  /**
   * Extend the default options object with user options.
   * @param {Object|String} userOpts
   * @returns {Object}
   */
  function extend (userOpts) {
    let options = {
      ignore: DEFAULT_IGNORE,
      path: REQUIRE_PATH
    }

    if (typeof userOpts === 'string') {
      options.namespace = userOpts
      return options
    }

    if (typeof userOpts === 'object' && isValidOptions(userOpts)) {
      return {
        ...options,
        ...userOpts,
        ignore: DEFAULT_IGNORE.concat(userOpts.ignore || []),
        path: path.resolve(REQUIRE_PATH, userOpts.path || '')
      }
    }

    return options
  }

  /**
   * Determine if a file or folder should be ignored.
   * @param {String} dir
   * @returns {Boolean}
   */
  function shouldIgnore (dir) {
    const abs = path.resolve(options.path, dir)
    const name = path.basename(abs)

    for (let val of options.ignore) {
      if (
        (typeof val === 'string' && abs === path.resolve(options.path, val)) ||
        (val instanceof RegExp && val.test(name))
      ) {
        return true
      }
    }

    return false
  }

  /**
   * Identify all elquire module definitions within `dir`.
   * @param {Object} modules
   * @param {Object} dir
   * @returns {Object}
   */
  function buildModules (modules, dir) {
    return fs.readdirSync(dir).reduce((modules, file) => {
      const moduleDir = path.join(dir, file)
      const isDir = fs.statSync(moduleDir).isDirectory()
      const ignore = shouldIgnore(dir)

      if (isDir && !ignore) {
        buildModules(modules, moduleDir)
      } else if (!ignore) {
        const obj = moduleDefinition(moduleDir)
        if (obj && !modules[obj.name]) {
          isValidModuleDefinition(obj)
          modules[obj.name] = moduleDir
        } else if (obj) {
          throw err(`module name '${obj.name}' is already registered`)
        }
      }

      return modules
    }, modules)
  }

  /**
   * Identify and generate a module definition for a file.
   * @param {String} filename
   * @returns {Object}
   */
  function moduleDefinition (filename) {
    const content = fs.readFileSync(filename, 'utf-8')
    const match = REGEX.declaration.exec(content)
    if (match) return {name: match[1]}
    return false
  }

  /**
   * Check that a module definition is valid against the
   * requirements defined in the `options` object.
   * @param {Object} moduleDef
   */
  function isValidModuleDefinition (moduleDef) {
    Object.keys(MODULE_VALIDATORS).forEach((optName) => {
      if (!(optName in options)) {
        return
      }

      const value = options[optName]
      const validator = MODULE_VALIDATORS[optName]

      if (!validator.fn(moduleDef, value)) {
        throw err(
          validator.msg
            .replace('{{name}}', moduleDef.name)
            .replace('{{expected}}', value.toString())
        )
      }
    })
    return true
  }

  /**
   * Check that the given options object is valid against the
   * requirements defined within the option validators.
   * @param {Object} opts
   * @returns {Boolean}
   */
  function isValidOptions (opts) {
    Object.keys(opts).forEach((name) => {
      if (!(name in OPTION_VALIDATORS)) {
        return
      }

      let value = opts[name]
      let validator = OPTION_VALIDATORS[name]

      if (!validator(value)) {
        throw err(`invalid value for option '${name}': ${value}`)
      }
    })
    return true
  }

  /**
   * Find elquire module names within a file and replace them with a
   * relative path from the current file to where the file exists.
   * @param {String} file
   * @param {String} content
   * @returns {String}
   */
  function transform (file, content) {
    [REGEX.es6, REGEX.commonJs].forEach((re) => {
      let match

      while ((match = re.exec(content)) != null) {
        let moduleName = match[1]

        if (modules[moduleName]) {
          let modulePath = modules[moduleName]
          let fromDir = path.dirname(file)
          let toDir = path.dirname(modulePath)
          let relativePath = path.relative(fromDir, toDir).replace(/[\\]/g, '/')
          let index = match.index + match[0].indexOf(match[1])
          let contentStart = content.substr(0, index)
          let contentEnd = content.substr(index + moduleName.length, content.length)
          relativePath = ['.', relativePath, path.basename(modulePath)].join('/')
          content = contentStart + relativePath + contentEnd
        }
      }
    })

    return content
  }

  return Object.defineProperties({}, {
    unload: {
      value: () => {
        global.__elquire = false
        require.extensions['.js'] = oldLoader
      },
      enumerable: true
    },
    modules: {
      value: modules,
      enumerable: true
    },
    options: {
      value: options,
      enumerable: true
    }
  })
}
