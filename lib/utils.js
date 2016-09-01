'use strict'

/** @module octane/utils */

var pluralize = require('pluralize')

/**
 *  Shallow copy of properties from the `src` object to the `dest` object. If the
 *  `noOverwrite` argument is set to to `true`, the value of a property in `src`
 *  will not be overwritten if it already exists.
 *
 * @param {Object} dest - destination object
 * @param {Object} src - source object
 * @param {Boolean} noOverwrite - set to `true` to overwrite values in `src`
 **/
exports.extend = function (dest, src, noOverwrite) {
  for (var prop in src) {
    if (!noOverwrite || typeof dest[prop] === 'undefined') {
      dest[prop] = src[prop]
    }
  }
  return dest
}

/**
* Transform a string that contains spaces, underscore, or dashes to CamelCase.
* If 'lower' is set to 'true', the string will be transformed to camelCase.
*
* @param {String} str - string to transform
* @param {Boolean} [lower] - set to 'true' to transform to camelCase
*/
exports.toCamelCase = function toCamelCase (str, lower) {
  str = str.toLowerCase().replace(/(?:(^.)|(\s+.)|(_.)|(-.))/g, function (match) {
    return match.charAt(match.length - 1).toUpperCase()
  })
  if (lower) {
    str = str.charAt(0).toLowerCase() + str.substr(1)
  }
  return str
}

/**
* Transform a string that contains underscore to words.
* If 'plural' is set to 'true', the string will be transformed to the plural words.
*
* @param {String} str - string to transform
* @param {Boolean} [plural] - set to 'true' to transform to the plural words
*/
exports.toDisplayName = function toDisplayName (str, plural) {
  var words = str.toLowerCase().split('_')
  if (plural && words.length > 0) {
    var index = words.length - 1
    words[index] = pluralize.plural(words[index])
  }
  return words.join(' ')
}

/**
* Remove whitespace from both sides of a string.
* If 'str' is not a string, return it directly.
*
* @param {String} str - string to trim
*/
exports.trim = function trinm (str) {
  if (typeof str !== 'string') {
    return str
  }

  return str.replace(/^[\s\t\r\n]+/, '').replace(/[\s\t\r\n]+$/, '')
}
