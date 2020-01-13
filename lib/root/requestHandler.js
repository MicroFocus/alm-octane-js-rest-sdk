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

const request = require('request-promise-native'),
  log4js = require('log4js'),
  Mutex = require('async-mutex').Mutex

const logger = log4js.getLogger()
logger.level = 'debug'

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
    if (!this._isAuthenticated) {
      await this.authenticate()
    }
    return this._requestor.get({ url: url }).catch(err => this.reauthenicate(err, { url: url }, 'get'))
  }

  async delete (url) {
    if (!this._isAuthenticated) {
      await this.authenticate()
    }
    return this._requestor.delete({ url: url }).catch(err => this.reauthenicate(err, { url: url }, 'delete'))
  }

  async update (url, body) {
    if (!this._isAuthenticated) {
      await this.authenticate()
    }
    const updateOptions = {
      url: url,
      body: { data: [body] }
    }

    return this._requestor.put(updateOptions).catch(err => this.reauthenicate(err, updateOptions, 'put'))
  }

  async create (url, body) {
    if (!this._isAuthenticated) {
      await this.authenticate()
    }
    const createOptions = {
      url: url,
      body: { data: [body] }
    }

    return this._requestor.post(createOptions).catch(err => this.reauthenicate(err, createOptions, 'post'))
  }

  async authenticate () {
    const authOptions = {
      url: '/authentication/sign_in',
      body: {
        user: this._user,
        password: this._password
      }
    }

    logger.debug('Logging in with the following details:\n', authOptions)
    const error = await this._requestor.post(authOptions).catch(err => {
      return err
    })

    if (error) {
      throw error
    }

    this._isAuthenticated = true
    return this
  }

  async signOut () {
    logger.debug('Signing out.')
    const error = await this._requestor.post({ url: '/authentication/sign_out' }).then(() => {
      this._isAuthenticated = false
    }).catch((err) => {
      return err
    })

    if (error) {
      throw error
    }
    return this
  }

  async reauthenicate (err, requestOptions, method) {
    this._needsAuthenication = true

    return this._mutex.runExclusive(async () => {
      if (err.statusCode === 401 && this._needsAuthenication) {
        await this.authenticate()
        this._needsAuthenication = false
      }

      return this._requestor[method](requestOptions).catch(err => {
        return err
      })
    })
  }
}

module.exports = RequestHandler