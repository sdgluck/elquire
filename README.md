# elquire

> Local Node dependencies without the hassle: require by a given name instead of a relative path.

Made with ❤ at [@outlandish](http://www.twitter.com/outlandish)

<a href="http://badge.fury.io/js/elquire"><img alt="npm version" src="https://badge.fury.io/js/elquire.svg"></a>
<a href="https://travis-ci.org/sdgluck/elquire"><img alt="CI build status" src="https://travis-ci.org/sdgluck/elquire.svg"></a>
[![js-standard-style](https://img.shields.io/badge/code%20style-standard-brightgreen.svg)](http://standardjs.com/)

__v1.0.0 introduces a breaking change!__ The module now expects immediate invocation with or without options. This avoids
traversing the directory structure for a first time without options, which was offered as a convenience but
adds unnecessary overhead:__

    // If you are doing this:
    require('elquire');

    // You must now do this:
    require('elquire')();

## Usage

Install with npm:

    npm install elquire --save

### 1. Initialise `elquire`

Initialise `elquire` at the top of your application's entry file and invoke with the desired namespace.

    require('elquire')('myApp');

    // Require your application:
    require('./index.js');

### 2. Register a module

Give any local dependency in your application a module definition at the beginning of the file:

    /// <module name=myApp.utility>

    // ... file contents ...

### 3. Require a module

Finally, replace the relative path to a local dependency with its given name:

    // BEFORE:
    let util = require('../../util/index.js');

    // AFTER:
    let util = require('myApp.utility');

Ta-da! At runtime `elquire` will dynamically resolve the dependency's name to a relative path (the above, backwards).

## Configuration

If you prefer, you can place all the options documented here within your `package.json` file. See an example below:

    // package.json
    "elquire": {
        "namespace": "myApp"
    }

    // initialisation without options object
    require('elquire')()

### `namespace`

Default: none

Require that all module names begin with the given string.

    require('elquire')('myApp');

    // or...

    require('elquire')({
        namespace: 'myApp'
    });

### `name`

Default: none

A regular expression to match against all module names.
`elquire` throws an error when a module name does not satisfy the regular expression.

    // begin names with 'local.'
    require('elquire')({
        name: /^local\./
    });

### `path`

Default: `'./'`

Override this behaviour:

    require('elquire')({
        path: './startInspectionHere'
    });

### `ignore`

Default: hidden folders & files (e.g. `.git`) and *node_modules* folders (`['node_modules', /^\./]`)

Add files and folders to ignore:

    require('elquire')({
        ignore: ['./doNotLookInHere']
    });

### All Options

    require('elquire')({

        // Set the namespace
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

## ES6

### Imports

`elquire` supports ES6 import statements. For example:

    import 'myApp.utility';
    import * from 'myApp.utility';
    import {utilMethod, anotherUtilMethod} from 'myApp.utility';
    // etc.

### Babel

If you are using `babel/register` in your application, require it __before__ `elquire` in your entry file:

    // entry.js
    require('babel/register');
    require('elquire');

    // index.js
    import 'myApp.utility';

## Contributing

All pull requests and issues welcome!
If you're not sure how, check out Kent C. Dodds' [great video tutorials on egghead.io](https://egghead.io/lessons/javascript-identifying-how-to-contribute-to-an-open-source-project-on-github)!
