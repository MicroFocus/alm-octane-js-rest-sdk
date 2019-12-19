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

/** @module octane/error */

const utils = require('./utils')
const Util = require('util')

/**
 * @class
 * @extends Error
 *
 * @param {String} message - error message
 * @param {Number} code - HTTP response status code
 * @param {Object} headers - HTTP response headers
 */
class HttpError extends Error {
  constructor (message, code, headers) {
    super(message)
    // this.message = message
    this.code = code
    this.status = statusCodes[code]
    this.headers = headers
  }

  /**
   * Returns the stringified version of the error (i.e. the message).
   */
  toString () {
    return this.message
  }

  /**
   * Returns a JSON object representation of the error.
   */
  toJSON () {
    return {
      code: this.code,
      status: this.status,
      message: this.message
    }
  }
}

const statusCodes = {
  400: 'Bad Request',
  401: 'Unauthorized',
  403: 'Forbidden',
  404: 'Not Found',
  405: 'Method Not Allowed',
  406: 'Not Acceptable',
  408: 'Request Timeout',
  409: 'Conflict',
  415: 'Unsupported Media Type',
  500: 'Internal Server Error',
  501: 'Not Implemented',
  503: 'Service Unavailable'
}

/**
 * @class BadRequest
 * @extends HttpError
 *
 * @param {String} message - error message
 */
// Generate the HttpError's child class.
for (const status in statusCodes) {
  const defaultMsg = statusCodes[status]

  const error = (function (defaultMsg, status) {
    return function (msg) {
      this.defaultMsg = defaultMsg
      HttpError.call(this, msg || status + ':' + defaultMsg, status)

      if (status >= 500) {
        Error.captureStackTrace(this, error)
      }
    }
  })(defaultMsg, status)

  Util.inherits(error, HttpError)
  const className = utils.toCamelCase(defaultMsg)
  module.exports[className] = error
  module.exports[status] = error
}

module.exports = HttpError
