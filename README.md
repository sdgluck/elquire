# elquire

> Local Node dependencies without the hassle: require by a given name instead of a relative path.

Made with ❤ at [@outlandish](http://www.twitter.com/outlandish)

<a href="http://badge.fury.io/js/elquire"><img alt="npm version" src="https://badge.fury.io/js/elquire.svg"></a>

## Usage

### 1. Register the module

Give any local dependency in your application a module definition at the beginning of the file:

    /// <module name=myApp.utility>

    // ... file contents ...

You can use any character as a separator. In fact, `elquire` has no concept of a separator. These are all legal within the same application:

    /// <module name=myAppUtility>
    /// <module name=myApp_utility>
    /// <module name=myApp/utility>
    /// <module name=myApp-utility>
    /// <module name=myApp:utility>
    // etc.

### 2. Initialise `elquire`

Initialise `elquire` at the top of your application's entry file and invoke with the desired namespace*:

    require('elquire')('myApp');

    // or...

    require('elquire')({
        namespace: 'myApp'
    });

### 3. Require the module by name

Finally, replace the relative path to a local dependency with its given name:

    // BEFORE:
    let util = require('../../util/index.js');

    // AFTER:
    let util = require('myApp.utility');

Ta-da! At runtime `elquire` will dynamically resolve the dependency's name to a relative path (the above, backwards).

*You are not forced to use a namespace, however I strongly recommend that you do in order to
avoid collisions with the names of external dependencies!

## Configuration

### `namespace`

Default: none.

Require that all module names begin with the given string.

    require('elquire')('myApp');

    // or...

    require('elquire')({
        namespace: 'myApp'
    });

### `name`

Default: none.

A regular expression to match against all module names.
`elquire` throws an error when a module name does not satisfy the regular expression.

    // begin names with 'local.'
    require('elquire')({
        name: /^local\./ 
    });

### `path`

Default: `'./'`.

Override this behaviour:

    require('elquire')({
        path: './startInspectionHere'
    });

### `ignore`

Default: hidden folders & files (e.g. `.git`) and *node_modules* folders (`['node_modules', /^\./]`).

Add files and folders to ignore:

    require('elquire')({
        ignore: ['./doNotLookInHere']
    });

### All Options

    require('elquire')({

        // Set the namespace (as above)
        namespace: 'myApp',

        // Ensure that all module names satisfy a regular expression
        // (this does not override `namespace`)
        name: /^myApp\./,

        // Path to the directory where elquire should operate
        // (all children of the path are inspected recursively)
        path: './path/to/application',

        // Files or directories to ignore
        // (strings should be relative to `path`)
        ignore: [
            './doNotLookInHere',
            /ignore/i
        ]
    });

## Babel

If you are using `babel/register` in your application, require it __before__ `elquire`. It will still
work as usual and `elquire` will transform module names in ES6 import statements too.

    // entry.js
    require('babel/register');
    require('elquire');

    // index.js
    import utility from 'myApp.utility';