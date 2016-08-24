'use strict'

/** @module octane */

var fs = require('fs')
var path = require('path')

var request = require('request')
var cookie = require('cookie')
var debug = require('debug')('octane')

var error = require('./error')
var utils = require('./utils')

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
*/
var Octane = function octane (config) {
  config = config || {}
  if (!config.host || !config.shared_space_id || !config.workspace_id) {
    throw new Error(
      'Octane host / shared space id / workspace id are required'
    )
  }

  this.config = config

  this.routes = JSON.parse(
    fs.readFileSync(path.join(__dirname, 'routes.json'), 'utf8')
  )

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
    baseUrl: baseUrl,
    headers: { HPECLIENTTYPE: 'HPE_REST_API_BETA' }
  }

  var proxy = this.config.proxy ||
              process.env.HTTPS_PROXY ||
              process.env.https_proxy ||
              process.env.HTTP_PROXY ||
              process.env.http_proxy
  if (proxy) {
    opt.proxy = proxy
  }

  debug('with options %j', opt)

  var requestor = request.defaults(opt)

  var body = {}
  if (options.username && options.password) {
    body.user = options.username
    body.password = options.password
  } else if (options.clientId && options.clientSecret) {
    body.client_id = options.clientId
    body.client_secret = options.clientSecret
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

    var hpssoCookieCsrf
    var cookies = response.headers['set-cookie']
    if (cookies) {
      cookies.forEach(function (value) {
        var parsedCookie = cookie.parse(value)
        if (parsedCookie.HPSSO_COOKIE_CSRF) {
          hpssoCookieCsrf = parsedCookie.HPSSO_COOKIE_CSRF
        }
      })
    }

    if (!hpssoCookieCsrf) {
      err = new error.ServiceUnavailable('cookie HPSSO_COOKIE_CSRF not found')
      debug('authentication failed %s', err)
      return callback(err)
    }

    baseUrl = baseUrl +
      '/api/shared_spaces/' + self.config.shared_space_id +
      '/workspaces/' + self.config.workspace_id

    requestor = requestor.defaults({
      baseUrl: baseUrl,
      headers: {
        'HPSSO-HEADER-CSRF': hpssoCookieCsrf
      }
    })

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
          "Invalid variable parameter name substitution; param '" +
          paramName +
          "' not found in defines block"
        )
      }
    } else {
      def = paramsStruct[paramName]
    }

    var value = utils.trim(msg[paramName])
    if (value === undefined && def['default']) {
      value = def['default']
    }

    if (value === undefined || value === null || value === '') {
      if (!def.required ||
          (def['allow-empty'] && value === '') ||
          (def['allow-null'] && value === null)) {
        continue
      } else {
        throw new error.BadRequest(
          "Empty value for parameter '" +
          paramName +
          "': " +
          value
        )
      }
    }

    if (def.validation) {
      if (!new RegExp(def.validation).test(value)) {
        throw new error.BadRequest(
          "Invalid value for parameter '" +
          paramName +
          "': " +
          value
        )
      }
    }

    if (def.type) {
      var type = def.type.toLowerCase()
      if (type === 'number') {
        value = parseInt(value, 10)
        if (isNaN(value)) {
          throw new error.BadRequest(
            "Invalid value for parameter '" +
            paramName +
            "': " +
            value
          )
        }
      } else if (type === 'date') {
        value = new Date(value)
      }

      if (typeof value !== 'object' && (
        type === 'object' ||
        type === 'reference' ||
        type === 'multi-reference')) {
        if (typeof value === 'string') {
          try {
            value = JSON.parse(value)
          } catch (ex) {
            throw new error.BadRequest(
              "JSON parse error of value for parameter '" +
              paramName +
              "': " +
              value
            )
          }
        } else {
          throw new error.BadRequest(
            "Invalid value for parameter '" +
            paramName +
            "': " +
            value
          )
        }
      }

      if (type === 'reference') {
        if ('id' in value && 'type' in value) {
          value = {id: value.id, type: value.type}
        } else {
          throw new error.BadRequest(
            "Invalid value for parameter '" +
            paramName +
            "': " +
            JSON.stringify(value)
          )
        }
      } else if (type === 'multi-reference') {
        var data
        var valid = false
        if (value.data && Array.isArray(value.data)) {
          data = []
          valid = true
          value.data.forEach(function (v) {
            if ('id' in v && 'type' in v) {
              data.push({id: v.id, type: v.type})
            } else {
              valid = false
            }
          })
        }

        if (valid) {
          value = {data: data}
        } else {
          throw new error.BadRequest(
            "Invalid value for parameter '" +
            paramName +
            "': " +
            JSON.stringify(value)
          )
        }
      }
    }

    msg[paramName] = value
  }
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
    if (response.req.method === 'GET') {
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

Octane.prototype.httpSend = function httpSend (msg, block, callback) {
  var url = block.url
  var body = {}

  Object.keys(block.params).forEach(function (paramName) {
    paramName = paramName.replace(/^[$]+/, '')
    if (!(paramName in msg)) {
      return
    }

    var paramValue = msg[paramName]
    var isUrlParam = url.indexOf(':' + paramName) !== -1
    if (isUrlParam) {
      url = url.replace(':' + paramName, paramValue)
    } else {
      body[paramName] = paramValue
    }
  })

  var method = block.method.toUpperCase()
  var options = {
    uri: url,
    method: method
  }
  if (Object.keys(body)) {
    if ('HEAD|GET|DELETE'.indexOf(method) !== -1) {
      options.qs = body
    } else if (method === 'POST') {
      options.body = {data: [body]}
    } else {
      options.body = body
    }
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
