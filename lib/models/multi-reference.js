'use strict'

/** @module octane/models/multiReference */

var assert = require('assert')

var Reference = require('./reference')

/**
* @class
*
* @param {Reference[]} refs - the references
*/
var MultiReference = function multiReference (refs) {
  refs.forEach(function (ref) {
    assert(ref instanceof Reference)
  })

  this.refs = refs
}

MultiReference.prototype.toJSON = function () {
  return {
    total_count: this.refs.length,
    data: this.refs
  }
}

MultiReference.parse = function (vals) {
  if (vals instanceof MultiReference) {
    return new MultiReference(vals.refs)
  }

  var refs = []
  for (var i = 0, l = vals.length; i < l; i++) {
    var ref = Reference.parse(vals[i])

    if (ref) {
      refs.push(ref)
    } else {
      return null
    }
  }

  return new MultiReference(refs)
}

module.exports = MultiReference
