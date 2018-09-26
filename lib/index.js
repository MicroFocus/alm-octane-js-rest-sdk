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

'use strict'

/** @module octane */

var fs = require('fs')
var path = require('path')

var request = require('request')
var debug = require('debug')('octane')

var error = require('./error')
var utils = require('./utils')
var Query = require('./query')
var Reference = require('./models/reference')
var MultiReference = require('./models/multi-reference')

var META_ROUTES_FILE = '../routes/meta.json'
var DEFAULT_ROUTES_FILE = '../routes/default.json'

/**
 * @class
 *
 * @param {Object} config - configurations to access Octane REST API
 * @param {('http'|'https')} [config.protocol] - protocol of Octane REST API URL
 * @param {String} config.host - server of Octane REST API URL
 * @param {Number} [config.port] - port of Octane REST API URL
 * @param {String} [config.pathPrefix] - path prefix of Octane REST API URL
 * @param {Number} config.shared_space_id - Octane shared space id
 * @param {Number} config.workspace_id - Octane workspace id
 * @param {String} [config.proxy] - if set, using proxy to connect to Octane
 * @param {String|Object} [config.routesConfig] - if set, using the specified path as API definition, or use the JSON object directly
*/
var Octane = function octane (config) {
  config = config || {}
  if (!config.host || !config.shared_space_id || !config.workspace_id) {
    throw new Error(
      'Octane host / shared space id / workspace id are required'
    )
  }

  this.config = config

  if (config.routesConfig && typeof config.routesConfig === 'object') {
    this.routes = config.routesConfig
  } else if (config.routesConfig && path.isAbsolute(config.routesConfig) && fs.existsSync(config.routesConfig)) {
    this.routes = JSON.parse(
      fs.readFileSync(config.routesConfig)
    )
  } else if (fs.existsSync(path.join(__dirname, DEFAULT_ROUTES_FILE))) {
    this.routes = JSON.parse(
      fs.readFileSync(path.join(__dirname, DEFAULT_ROUTES_FILE), 'utf8')
    )
  } else {
    this.routes = JSON.parse(
      fs.readFileSync(path.join(__dirname, META_ROUTES_FILE), 'utf8')
    )
  }

  this.setupRoutes()
}

/**
 * Login to Ocatne. It's required for futher requests.
 *
 * @param {Object} options - Object containing the user credential or API key
 * @param {String} options.username - username
 * @param {String} options.password - password
 * @param {String} options.client_id - API client id
 * @param {String} options.client_secret - API client secret
 */
Octane.prototype.authenticate = function authenticate (options, callback) {
  var self = this
  options = options || {}

  debug('authenticate %j', options)

  var host = this.config.host ||
    this.constants.host
  var protocol = this.config.protocol ||
    this.constants.protocol ||
    'http'
  var port = this.config.port ||
    (protocol === 'https' ? 443 : 80)
  var pathPrefix = this.config.pathPrefix
    ? '/' + this.config.pathPrefix.replace(/(^[\/]+|[\/]+$)/g, '')
    : ''

  var baseUrl = protocol + '://' + host + ':' + port + pathPrefix

  var opt = {
    jar: true,
    json: true,
    baseUrl: baseUrl
  }

  if (this.config.proxy) {
    opt.proxy = proxy
  }

  debug('with options %j', opt)

  var requestor = request.defaults(opt)

  var body = {}
  // var body = {}
  if (options.username && options.password) {
    body.user = options.username
    body.password = options.password
  } else if (options.client_id && options.client_secret) {
    body.client_id = options.client_id
    body.client_secret = options.client_secret
  }

  requestor.post({
    uri: '/authentication/sign_in',
    body: body
  }, function (err, response, body) {
    if (err) {
      debug('authentication failed %j', err)
      return callback(err)
    }

    if (response.statusCode >= 400) {
      err = new error.HttpError(body, response.statusCode, response.headers)
      debug('authentication failed %j', err)
      return callback(err)
    }

    baseUrl = baseUrl +
      '/api/shared_spaces/' + self.config.shared_space_id +
      '/workspaces/' + self.config.workspace_id

    requestor = requestor.defaults({
      baseUrl: baseUrl
    })

    if (self.config.tech_preview_API) {
      requestor = requestor.defaults({headers: {'HPECLIENTTYPE': 'HPE_REST_API_TECH_PREVIEW'}})
    }

    self.requestor = requestor
    callback()
  })
}

/**
 * setupRoute() is invoked by the constructor, takes the contents of the
 * JSON document that contains the definitions of all the available API
 * routes and iterate over them.
 * It first recurses through each definition block until it reaches an API
 * endpoint. It knows that an endpoint is found when the 'url' and 'param'
 * definitions are found as a direct member of a definition block.
 * A method is attached to the Octane instance and becomes available for use.
 * Inside this method, the parameter validation and typecasting is done,
 * according to the definition of the parameters in the 'params' block, upon
 * invocation.
 */
Octane.prototype.setupRoutes = function setupRoutes () {
  var routes = this.routes
  var defines = routes.defines
  this.constants = defines.constants
  this.params = defines.params
  delete routes.defines

  this.prepareApi(routes)
}

Octane.prototype.prepareApi = function prepareApi (struct, baseType) {
  baseType = baseType || ''

  var self = this
  Object.keys(struct).forEach(function (routePart) {
    var block = struct[routePart]
    if (!block) {
      return
    }

    var messageType = baseType + '/' + routePart
    if (block.url && block.params) {
      var parts = messageType.split('/')
      var section = utils.toCamelCase(parts[1].toLowerCase(), true)
      parts.splice(0, 2)
      var funcName = utils.toCamelCase(parts.join('-'), true)

      if (!self[section]) {
        self[section] = {}
        self[utils.toCamelCase('get-' + section + '-api', true)] = function () {
          return self[section]
        }
      }

      self[section][funcName] = function (msg, callback) {
        debug('#%s.%s %j', section, funcName, msg)

        if (!self.requestor) {
          var err = new error.Unauthorized('authentication is required')
          self.sendError(err, msg, block, callback)
        }

        try {
          self.parseParams(msg, block.params)
        } catch (ex) {
          self.sendError(ex, msg, block, callback)
          return
        }

        self.handler(msg, JSON.parse(JSON.stringify(block)), callback)
      }
    } else {
      self.prepareApi(block, messageType)
    }
  })
}

Octane.prototype.parseParams = function parseParams (msg, paramsStruct) {
  var self = this
  if (msg instanceof Array) {
    msg.forEach(entry => self.parseParams(entry, paramsStruct))
    return
  }

  var params = Object.keys(paramsStruct)

  for (var i = 0, l = params.length; i < l; i++) {
    var paramName = params[i]

    var def
    if (paramName.charAt(0) === '$') {
      paramName = paramName.substr(1)
      if (self.params[paramName]) {
        def = paramsStruct[paramName] = self.params[paramName]
        delete paramsStruct['$' + paramName]
      } else {
        throw new error.BadRequest(
          'Invalid variable parameter name substitution; param \'' +
          paramName +
          '\' not found in defines block'
        )
      }
    } else {
      def = paramsStruct[paramName]
    }

    var value = utils.trim(msg[paramName])
    if (value === undefined || value === null || value === '') {
      if (def.required) {
        throw new error.BadRequest(
          'Empty value for parameter \'' +
          paramName +
          '\': ' +
          value
        )
      } else {
        continue
      }
    }

    value = this.sanitizeParam(paramName, value, def)

    msg[paramName] = value
  }
}

Octane.prototype.sanitizeParam = function verifyParam (paramName, value, definition) {
  if (!definition.type) {
    return value
  }

  var isInvalid = false
  switch (definition.type) {
    case 'integer':
      var i = parseInt(value, 10)
      if (isNaN(i)) {
        isInvalid = false
      } else {
        if ((definition.min_value && i < definition.min_value) ||
          (definition.max_value && i > definition.max_value)) {
          isInvalid = false
        } else {
          value = i
        }
      }
      break
    case 'boolean':
      if (typeof value !== 'boolean') {
        isInvalid = true
      }
      break
    case 'datetime':
    case 'date':
      var d = new Date(value)
      if (isNaN(d.getTime())) {
        isInvalid = true
      } else {
        value = d.toISOString()
      }
      break
    case 'string':
    case 'memo':
      if (typeof value !== 'string') {
        isInvalid = true
      } else {
        if (definition.max_length && value.length > definition.max_length) {
          isInvalid = true
        }
      }
      break
    case 'object':
      if (typeof value !== 'object') {
        isInvalid = true
      }
      break
    case 'reference':
      var ref
      var multiple = definition.field_type_data.multiple
      if (multiple) {
        ref = MultiReference.parse(value)
      } else {
        ref = Reference.parse(value)
      }
      if (ref) {
        value = ref
      } else {
        isInvalid = true
      }
      break
    case 'query':
      if (value instanceof Query) {
        value = '"' + value.build() + '"'
      } else {
        isInvalid = true
      }
      break
    case 'file':
      if (typeof value !== 'string') {
        isInvalid = true
      } else {
        if (path.isAbsolute(value)) {
          value = fs.createReadStream(value)
        } else {
          isInvalid = true
        }
      }
      break
    default:
      throw new error.BadRequest(
        'Unknown parameter type for parameter \'' +
        paramName +
        '\': ' +
        definition.type
      )
  }

  if (isInvalid) {
    throw new error.BadRequest(
      'Invalid value for parameter \'' +
      paramName +
      '\': ' +
      typeof value === 'object' ? JSON.stringify(value) : value
    )
  }

  return value
}

Octane.prototype.handler = function handler (msg, block, callback) {
  var self = this

  this.httpSend(msg, block, function (err, response, body) {
    if (err) {
      return self.sendError(err, msg, block, callback)
    }

    debug('status %d', response.statusCode)

    if (response.statusCode >= 400) {
      err = new error.HttpError(body, response.statusCode, response.headers)
      return self.sendError(err, msg, block, callback)
    }

    var ret = body
    if (response.headers['content-type'] === 'application/octet-stream') {
      ret = body
    } else if (response.req.method === 'GET' || response.request.method === 'GET') {
      if ('total_count' in ret && 'data' in ret) {
        var totalCount = ret['total_count']
        var data = ret['data']

        ret = data
        ret.meta = {total_count: totalCount}
      }
    } else if (response.req.method === 'POST') {
      if ('data' in ret && ret['data'].length === 1) {
        ret = ret['data'][0]
      }
    }

    if (callback && typeof callback === 'function') {
      callback(null, ret)
    }
  })
}

Octane.prototype.convertBlockToBody = function httpSend (msg, block) {
  var body = {}
  Object.keys(block.params).forEach(function (paramName) {
    paramName = paramName.replace(/^[$]+/, '')
    if (!(paramName in msg)) {
      return
    }

    var paramValue = msg[paramName]
    var isUrlParam = block.url.indexOf(':' + paramName) !== -1
    if (isUrlParam) {
      block.url = block.url.replace(':' + paramName, paramValue)
    } else {
      body[paramName] = paramValue
    }
  })

  return body
}

Octane.prototype.httpSend = function httpSend (msg, block, callback) {
  var self = this
  var body = {}
  var method = block.method.toUpperCase()
  var accept = block['accept']
  var contentType = block['content-type']

  if (msg instanceof Array) {
    body['data'] = msg.map(entry => self.convertBlockToBody(entry, block), self)
  } else if (method === 'POST' && (!contentType || contentType !== 'multipart/form-data')) {
    body['data'] = [self.convertBlockToBody(msg, block)]
  } else {
    body = self.convertBlockToBody(msg, block)
  }

  var url = block.url
  var options = {
    uri: url,
    method: method
  }
  if (Object.keys(body)) {
    if ('HEAD|GET|DELETE'.indexOf(method) !== -1) {
      options.qs = body
    } else if (method === 'POST' && contentType && contentType === 'multipart/form-data') {
      var content = body.file
      delete body.file
      var entity = JSON.stringify(body)
      options.formData = {
        entity: {
          value: entity,
          options: {
            contentType: 'application/json'
          }
        },
        content: content
      }
    } else {
      options.body = body
    }
  }
  if (accept && accept === 'application/octet-stream') {
    options.headers = {'accept': 'application/octet-stream'}
    options.encoding = null
  }

  debug('sendHttp %j', options)
  this.requestor(options, callback)
}

Octane.prototype.sendError = function sendError (err, msg, block, callback) {
  debug('error %j', err)
  debug('block %j', block)
  debug('msg %j', msg)

  if (typeof err === 'string') {
    err = new error.InternalServerError(err)
  }

  if (callback && typeof callback === 'function') {
    callback(err)
  }
}

module.exports = Octane
