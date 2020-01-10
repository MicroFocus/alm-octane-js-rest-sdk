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
  UrlBuilder = require('./urlBuilder'),
  RequestHandler = require('./requestHandler')

const logger = log4js.getLogger()
logger.level = 'debug'

class Octane {
  constructor (params) {
    this._urlBuilder = new UrlBuilder(params.server, params.sharedSpace, params.workspace)
    this.requestHandler = new RequestHandler(params)

    this.requestMethod = null

    this.types = {
      defects: 'defects',
      stories: 'stories',
      epics: 'epics',
      features: 'features',
      workItems: 'workItems',
      manualTests: 'manualTests'
    }
  }

  limit (limit) {
    this._urlBuilder.limit(limit)
    return this
  }

  at (id) {
    this._urlBuilder.at(id)
    return this
  }

  offset (offset) {
    this._urlBuilder.offset(offset)
    return this
  }

  orderBy (...fieldNames) {
    this._urlBuilder.orderBy(fieldNames)
    return this
  }

  fields(...fieldNames) {
    this._urlBuilder.fields(fieldNames)
    return this
  }

  get (entityName) {
    this._urlBuilder.getEntityUrl(entityName)
    this.requestMethod = 'get'
    return this
  }

  query (query) {
    this._urlBuilder.query(query)
    return this
  }

  async execute() {
    return this.requestHandler[this.requestMethod](this._urlBuilder.build())
  }
}

module.exports = Octane
