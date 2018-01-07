/*!
 * (c) 2016-2018 EntIT Software LLC, a Micro Focus company
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
*/

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
