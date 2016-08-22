'use strict'

/** @module octane/utils */

/**
* Transform a string that contains spaces or dashes to CamelCase.
* If 'lower' is set to 'true', the string will be transformed to camelCase.
*
* @param {String} str - string to transform
* @param {Boolean} [lower] - set to 'true' to transform to camelCase
*/
exports.toCamelCase = function toCamelCase (str, lower) {
  str = str.toLowerCase().replace(/(?:(^.)|(\s+.)|(-.))/g, function (match) {
    return match.charAt(match.length - 1).toUpperCase()
  })
  if (lower) {
    str = str.charAt(0).toLowerCase() + str.substr(1)
  }
  return str
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
