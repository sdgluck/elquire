# Changelog

## 0.1.0

- [_Breaking_] The module now expects immediate invocation with or without options. This avoids traversing the
directory structure for a first time without options, which was offered as a convenience but adds unnecessary overhead.
- Supports Node >=0.12 via Babel
- Added ability to set elquire options by package.json `elquire` property.
- Added option `requireFilename`: if `true` all module names must end with the name of the file for which the name is being defined.
- Added option `modules`: predefine a list of modules by module name => module file path.

## 0.0.2

- Internal record of modules is now a Map instead of an Object.

## 0.0.1

- Release! :-)
