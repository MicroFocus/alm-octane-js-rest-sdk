'use strict'

/** @module octane/models/reference */

var assert = require('assert')

/**
* @class
*
* @param {Number} id - the referenced entity id
* @param {String} type - the referenced entity type
*/
var Reference = function reference (id, type) {
  assert(typeof id === 'number')
  assert(typeof type === 'string')
  this.id = id
  this.type = type
}

Reference.prototype.toJSON = function () {
  return {
    id: this.id,
    type: this.type
  }
}

Reference.parse = function (val) {
  if (val instanceof Reference) {
    return new Reference(val.id, val.type)
  }

  if (typeof val === 'object' && 'id' in val && 'type' in val) {
    var id = val.id
    if (typeof id === 'string') {
      id = parseInt(id, 10)
    }
    return new Reference(id, val.type)
  }

  return null
}

module.exports = Reference
