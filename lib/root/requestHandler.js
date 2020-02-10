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

  /**
   * Fires a GET request for the given URL. In case the request fails with a 401 (Unauthorized) code, one attempt to reauthenticate is sent. If the authentication was successful the initial request is fired again and the response is returned.
   *
   * @param url - A url to the specific resource. The URL should exclude the server and point to the desired resource.
   * @returns - The result of the operation returned by the server.
   * @throws - The error returned by the server if the request fails.
   */
  async get (url) {
    return this._requestor.get({ url: url }).catch(async err => {
      await this._reauthenticate(err)
      return this._requestor.get({ url: url })
    })
  }

  /**
   * Fires a DELETE request for the given URL. In case the request fails with a 401 (Unauthorized) code, one attempt to reauthenticate is sent. If the authentication was successful the initial request is fired again and the response is returned.
   *
   * @param url - A url to the specific resource. The URL should exclude the server and point to the desired resource.
   * @returns - The result of the operation returned by the server.
   * @throws - The error returned by the server if the request fails.
   */
  async delete (url) {
    return this._requestor.delete({ url: url }).catch(async err => {
      await this._reauthenticate(err)
      return this._requestor.delete({ url: url })
    })
  }

  /**
   * Fires a PUT request for the given URL. In case the request fails with a 401 (Unauthorized) code, one attempt to reauthenticate is sent. If the authentication was successful the initial request is fired again and the response is returned.
   *
   * @param url - A url to the specific resource. The URL should exclude the server and point to the desired resource.
   * @param body - A JSON which will be passed in the body of the request.
   * @returns - The result of the operation returned by the server.
   * @throws - The error returned by the server if the request fails.
   */
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

  /**
   * Fires a POST request for the given URL. In case the request fails with a 401 (Unauthorized) code, one attempt to reauthenticate is sent. If the authentication was successful the initial request is fired again and the response is returned.
   *
   * @param url - A url to the specific resource. The URL should exclude the server and point to the desired resource.
   * @param body - A JSON which will be passed in the body of the request.
   * @returns - The result of the operation returned by the server.
   * @throws - The error returned by the server if the request fails.
   */
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
   *
   * @throws - The error returned by the server if the request fails.
   */
  async authenticate () {
    const authOptions = {
      url: '/authentication/sign_in',
      body: {
        user: this._user,
        password: this._password
      }
    }

    logger.debug('Signing in...')
    const request = await this._requestor.post(authOptions)
    logger.debug('Signed in.')

    return request
  }

  /**
   * Fires a GET request for the given URL. In case the request fails with a 401 (Unauthorized) code, one attempt to reauthenticate is sent. If the authentication was successful the initial request is fired again and the response is returned.
   *
   * @param url - A url to the specific resource. The URL should exclude the server and point to the desired resource.
   * @returns - The result of the operation returned by the server. The result is the content of the targeted attachment.
   * @throws - The error returned by the server if the request fails.
   */
  async getAttachmentContent (url) {
    return this._requestor.get({ url: url, headers: { accept: 'application/octet-stream' } }).catch(async err => {
      await this._reauthenticate(err)
      return this._requestor.get({ url: url, headers: { accept: 'application/octet-stream' } })
    })
  }

  /**
   * Fires a POST request for the given URL. This request should upload the attachment to Octane. In case the request fails with a 401 (Unauthorized) code, one attempt to reauthenticate is sent. If the authentication was successful the initial request is fired again and the response is returned.
   *
   * @param url - A url to the specific resource. The URL should exclude the server and point to the desired resource.
   * @param body - An object which will be passed in the body of the request. This object should contain the content of the attachment.
   * @returns - The result of the operation returned by the server.
   * @throws - The error returned by the server if the request fails.
   */
  async uploadAttachment (url, body) {
    const createOptions = {
      url: url,
      body: body,
      headers: {
        'content-type': 'application/octet-stream'
      }
    }

    return this._requestor.post(createOptions).catch(async err => {
      await this._reauthenticate(err)
      return this._requestor.post(createOptions)
    })
  }

  /**
   * A sign out request is fired.
   *
   * @throws - The error returned by the server if the request fails.
   */
  async signOut () {
    logger.debug('Signing out...')
    const request = await this._requestor.post({ url: '/authentication/sign_out' })
    logger.debug('Signed out.')

    return request
  }

  /**
   * In case the previous request had a 401 (Unauthorized) status code, an authentication request must be fired.
   *
   * @param {Object} err - The error code of the previous error thrown at the failed request.
   * @throws - The error returned by the server if the request fails.
   * @private
   */
  async _reauthenticate (err) {
    this._needsAuthenication = true

    return this._mutex.runExclusive(async () => {
      if (err.statusCode === 401) {
        if (!this._needsAuthenication) { return }
        logger.debug('The received error had status code 401. Trying to authenticate...')
        const request = await this.authenticate()
        this._needsAuthenication = false

        return request
      } else {
        throw err
      }
    })
  }
}

module.exports = RequestHandler
