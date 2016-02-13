require('babel-register')
module.exports = {
  elquire: require('../../index.js')(),
  value: require('./realES6.js')
}
