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
    this.user = params.user
    this.password = params.password

    this.mutex = new Mutex()

    const options = {
      baseUrl: params.server,
      json: true,
      jar: true
    }
    if (params.proxy) {
      options.proxy = params.proxy
    }

    if (params.headers) {
      options.headers = params.headers
    }

    this.requestor = request.defaults(options)
  }

  async get (url) {
    return this.requestor.get({ url: url }).catch(err => this.reauthenicate(err, { url: url }))
  }

  async delete (url) {
    return this.requestor.delete({ url: url }).catch(err => this.reauthenicate(err, { url: url }))
  }

  async update (url, body) {
    const updateOptions = {
      url: url,
      body: body
    }

    return this.requestor.put(updateOptions).catch(err => this.reauthenicate(err, updateOptions))
  }

  async cerate (url, body) {
    const createOptions = {
      url: url,
      body: body
    }

    return this.requestor.post(createOptions).catch(err => this.reauthenicate(err, createOptions))
  }

  async authenticate () {
    const authOptions = {
      url: '/authentication/sign_in',
      body: {
        user: this.user,
        password: this.password
      }
    }

    logger.debug('Logging in with the following details:\n', authOptions)
    const error = await this.requestor.post(authOptions).catch(err => {
      return err
    })

    if (error) {
      throw error
    }

    return this
  }

  async reauthenicate (err, requestOptions) {
    this.needsAuthenication = true

    return this.mutex.runExclusive(async () => {
      if (err.statusCode === 401 && this.needsAuthenication) {
        await this.authenticate()
        this.needsAuthenication = false
      }

      return this.requestor.get(requestOptions).catch(err => {
        return err
      })
    })
  }
}

module.exports = RequestHandler