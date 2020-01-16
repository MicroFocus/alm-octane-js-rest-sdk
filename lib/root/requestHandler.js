/*!
 * (c) Copyright 2020 Micro Focus or one of its affiliates.
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

const request = require('request-promise-native')
const log4js = require('log4js')
const Mutex = require('async-mutex').Mutex

const logger = log4js.getLogger()
logger.level = 'debug'

/**
 * @class
 *
 * @param {Object} params - configurations to access Octane REST API
 * @param {String} params.server - server of Octane REST API URL (ex: https://myOctane:8080)
 * @param {Number} params.user - Octane user
 * @param {Number} params.password - Octane password
 * @param {String} [params.proxy] - if set, using proxy to connect to Octane
 * @param {Object} [params.headers] - JSON containing headers which will be used for all the requests
 */
class RequestHandler {
  constructor (params) {
    this._user = params.user
    this._password = params.password

    this._mutex = new Mutex()

    this._options = {
      baseUrl: params.server,
      json: true,
      jar: request.jar()
    }
    if (params.proxy) {
      this._options.proxy = params.proxy
    }

    if (params.headers) {
      this._options.headers = params.headers
    }

    this._requestor = request.defaults(this._options)
    this._isAuthenticated = false
  }

  async get (url) {
    await this._checkAuthentication()

    return this._requestor.get({ url: url }).catch(err => this._reauthenicate(err, { url: url }, 'get'))
  }

  async delete (url) {
    await this._checkAuthentication()

    return this._requestor.delete({ url: url }).catch(err => this._reauthenicate(err, { url: url }, 'delete'))
  }

  async update (url, body) {
    await this._checkAuthentication()

    const updateOptions = {
      url: url,
      body: { data: [body] }
    }

    return this._requestor.put(updateOptions).catch(err => this._reauthenicate(err, updateOptions, 'put'))
  }

  async create (url, body) {
    await this._checkAuthentication()

    const createOptions = {
      url: url,
      body: body
    }

    return this._requestor.post(createOptions).catch(err => this._reauthenicate(err, createOptions, 'post'))
  }

  /**
   * A sign in request is fired.
   * Throws an error in case it was not successful.
   */
  async authenticate () {
    const authOptions = {
      url: '/authentication/sign_in',
      body: {
        user: this._user,
        password: this._password
      }
    }

    logger.debug('Signing in.')
    await this._requestor.post(authOptions)

    logger.debug('Signed in request - Success.')
    this._isAuthenticated = true
  }

  /**
   * A sign out request is fired.
   * Throws an error in case it was not successful.
   */
  async signOut () {
    logger.debug('Signing out.')

    await this._requestor.post({ url: '/authentication/sign_out' }).then(() => {
      this._isAuthenticated = false
    })

    logger.debug('Signed out.')
    return this
  }

  /**
   * In case the previous request had a 401 status code, an authentication request must be fired.
   *
   * @param {Object} err - The error code of the previous error
   * @param {Object} requestOptions - The options for the new request
   * @param {String} method - A request method name (post/put/get/delete)
   * @returns - The error in case the authentication fails OR the response of the request if it was successful
   */
  async _reauthenicate (err, requestOptions, method) {
    this._needsAuthenication = true

    return this._mutex.runExclusive(async () => {
      if (err.statusCode === 401 && this._needsAuthenication) {
        await this.authenticate()
        this._needsAuthenication = false
      }

      return this._requestor[method](requestOptions)
    })
  }

  async _checkAuthentication () {
    if (!this._isAuthenticated) {
      await this.authenticate()
    }
  }
}

module.exports = RequestHandler
