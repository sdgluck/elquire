# Changelog

## 1.0.0

- [_Breaking_] The module now expects immediate invocation with or without options. This avoids traversing the
directory structure for a first time without options, which was offered as a convenience but adds unnecessary overhead.
- Added ability to set elquire options by package.json `elquire` property.

## 0.0.2

- Internal record of modules is now a Map instead of an Object.

## 0.0.1

- Release! :-)
