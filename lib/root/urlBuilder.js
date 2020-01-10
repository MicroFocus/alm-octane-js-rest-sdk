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

class UrlBuilder {
  constructor (baseUrl, sharedSpace, workspace) {
    this.baseUrl = baseUrl
    this.sharedSpace = sharedSpace
    this.workspace = workspace

    this.resetRequestUrl()
  }

  getEntityUrl (entityName) {
    this.requestUrl.entityName = entityName
  }

  limit (limit) {
    this.requestUrl.limit = limit
  }

  offset (offset) {
    this.requestUrl.offset = offset
  }

  fields (fieldNames) {
    this.putFieldNamesInJson(fieldNames, 'fields')
  }

  orderBy (fieldNames) {
    this.putFieldNamesInJson(fieldNames, 'orderBy')
  }

  query (query) {
    this.requestUrl.query = `"${query}"`
  }

  putFieldNamesInJson (fieldNames, jsonProperty) {
    this.requestUrl[jsonProperty] = ''
    let isFirst = true
    fieldNames.forEach((fieldName) => {
      if (isFirst) {
        this.requestUrl[jsonProperty] = `${this.requestUrl[jsonProperty]}${fieldName}`
        isFirst = false
      } else {
        this.requestUrl[jsonProperty] = `${this.requestUrl[jsonProperty]},${fieldName}`
      }
    })
  }

  at (id) {
    this.requestUrl.at = id
  }

  isBaseApiUrl () {
    if (this.requestUrl === this.baseApiUrl) {
      return true
    }
    return false
  }

  build () {
    this.isFirstParam = true

    let builtUrl = ''

    if (this.requestUrl.entityName) {
      builtUrl = `${builtUrl}/api/shared_spaces/${this.sharedSpace}/workspaces/${this.workspace}/${this.requestUrl.entityName}`
    }
    if (this.requestUrl.at) {
      builtUrl = `${builtUrl}/${this.requestUrl.at}`
      if (this.requestUrl.fields) {
        builtUrl = `${builtUrl}?fields=${this.requestUrl.fields}`
      }
      this.resetRequestUrl()
      return builtUrl
    }

    if (this.requestUrl.fields) {
      builtUrl = this.addParam(builtUrl, 'fields', this.requestUrl.fields)
    }
    if (this.requestUrl.limit) {
      builtUrl = this.addParam(builtUrl, 'limit', this.requestUrl.limit)
    }
    if (this.requestUrl.offset) {
      builtUrl = this.addParam(builtUrl, 'offset', this.requestUrl.offset)
    }
    if (this.requestUrl.query) {
      builtUrl = this.addParam(builtUrl, 'query', this.requestUrl.query)
    }
    if (this.requestUrl.orderBy) {
      builtUrl = this.addParam(builtUrl, 'order_by', this.requestUrl.orderBy)
    }

    this.resetRequestUrl()
    return builtUrl
  }

  addParam (builtUrl, paramName, paramValue) {
    if (this.isFirstParam) {
      builtUrl = `${builtUrl}?${paramName}=${paramValue}`
      this.isFirstParam = false
    } else {
      builtUrl = `${builtUrl}&${paramName}=${paramValue}`
    }
    return builtUrl
  }

  resetRequestUrl () {
    this.requestUrl = {
      sharedSpace: this.sharedSpace,
      workspace: this.workspace,
      entityName: null,
      at: null,
      fields: null,
      limit: null,
      offset: null,
      query: null,
      orderBy: null
    }
  }

}

module.exports = UrlBuilder
