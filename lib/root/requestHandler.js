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
  }

  async get (url) {
    return this._requestor.get({ url: url }).catch(async err => {
      await this._reauthenticate(err)
      return this._requestor.get({ url: url })
    })
  }

  async delete (url) {
    return this._requestor.delete({ url: url }).catch(async err => {
      await this._reauthenticate(err)
      return this._requestor.delete({ url: url })
    })
  }

  async update (url, body) {
    const updateOptions = {
      url: url,
      body: body
    }

    return this._requestor.put(updateOptions).catch(async err => {
      await this._reauthenticate(err)
      return this._requestor.put(updateOptions)
    })
  }

  async create (url, body) {
    const createOptions = {
      url: url,
      body: body
    }

    return this._requestor.post(createOptions).catch(async err => {
      await this._reauthenticate(err)
      return this._requestor.post(createOptions)
    })
  }

  /**
   * A sign in request is fired.
   * Throws an error in case the request was not successful.
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
    const request = await this._requestor.post(authOptions)
    logger.debug('Signed in.')

    return request
  }

  /**
   * A sign out request is fired.
   * Throws an error in case the request was not successful.
   */
  async signOut () {
    logger.debug('Signing out.')
    const request = await this._requestor.post({ url: '/authentication/sign_out' })
    logger.debug('Signed out.')

    return request
  }

  /**
   * In case the previous request had a 401 (Unauthorized) status code, an authentication request must be fired.
   *
   * @param {Object} err - The error code of the previous error
   * @returns - The error in case the authentication fails
   */
  async _reauthenticate (err) {
    this._needsAuthenication = true

    return this._mutex.runExclusive(async () => {
      if (err.statusCode === 401 && this._needsAuthenication) {
        const request = await this.authenticate()
        this._needsAuthenication = false

        return request
      }
    })
  }
}

module.exports = RequestHandler
