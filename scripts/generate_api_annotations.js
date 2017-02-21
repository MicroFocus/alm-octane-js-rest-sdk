/*!
 * (c) Copyright 2016 Hewlett Packard Enterprise Development LP
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

var fs = require('fs')
var path = require('path')

var utils = require('../lib/utils')

var DEFAULT_ROUTES_FILE = '../routes/default.json'
var API_ANNOTATIONS_FILE = '../doc/apidoc.js'

function generateAPIAnnotations () {
  console.log('generating api annotations ...')

  var routes
  var defaultParams
  var apiAnnotations

  console.log('loading default routes file ...')
  try {
    routes = JSON.parse(
      fs.readFileSync(path.join(__dirname, DEFAULT_ROUTES_FILE), 'utf8')
    )
    if (routes.defines) {
      defaultParams = routes.defines.params
      delete routes.defines
    }
    defaultParams = defaultParams || {}
  } catch (ex) {
    console.error(ex)
    process.exit(1)
  }

  apiAnnotations = parseRoutes(routes, defaultParams)

  saveApiAnnotationsToFile(apiAnnotations, API_ANNOTATIONS_FILE)
}

function parseRoutes (routes, defaultParams) {
  console.log('parsing default routes ...')

  var apiAnnotations = ''

  function generateAPI (routes, baseType) {
    baseType = baseType || ''

    Object.keys(routes).forEach(function (routePart) {
      var routeBlock = routes[routePart]
      if (!routeBlock) {
        return
      }

      var messageType = baseType + '/' + routePart
      if (routeBlock.url && routeBlock.params) {
        console.log('generating api annotation for ' + messageType + ' ...')
        var parts = messageType.split('/')
        var section = utils.toCamelCase(parts[1].toLowerCase(), true)
        parts.splice(0, 2)
        var funcName = utils.toCamelCase(parts.join('-'), true)

        apiAnnotations += generateAPIAnnotation(section, funcName, routeBlock, defaultParams)
      } else {
        generateAPI(routeBlock, messageType)
      }
    })
  }

  generateAPI(routes)

  return apiAnnotations
}

function generateAPIAnnotation (section, funcName, block, defaultParams) {
  var url = block['url']
  var method = block['method'].toLowerCase()
  var description = block['description']

  var annotation = [
    '/**',
    ' * @api {' + method + '} ' + encodeURI(url) + ' ' + funcName,
    ' * @apiName ' + funcName,
    ' * @apiDescription ' + description,
    ' * @apiGroup ' + section,
    ' *'
  ]

  var paramsObj = block['params']
  var paramKeys = Object.keys(paramsObj)
  paramKeys.sort(function (paramA, paramB) {
    var cleanParamA = paramA.replace(/^\$/, '')
    var cleanParamB = paramB.replace(/^\$/, '')

    var paramInfoA = paramsObj[paramA] || defaultParams[cleanParamA]
    var paramInfoB = paramsObj[paramB] || defaultParams[cleanParamB]

    var paramRequiredA = paramInfoA['required']
    var paramRequiredB = paramInfoB['required']

    if (paramRequiredA && !paramRequiredB) return -1
    if (!paramRequiredA && paramRequiredB) return 1
    return 0
  })

  paramKeys.forEach(function (param) {
    var cleanParam = param.replace(/^\$/, '')
    var paramInfo = paramsObj[param] || defaultParams[cleanParam]

    var paramType = paramInfo['type']
    var paramRequired = paramInfo['required']
    var paramDescription = paramInfo['description']

    var paramLabel = cleanParam

    if (!paramRequired) {
      paramLabel = '[' + paramLabel + ']'
    }

    if (paramType === 'integer') {
      if (paramInfo['min_value'] || paramInfo['max_value']) {
        paramDescription += ' (min_value: ' +
          paramInfo['min_value'] +
          ', max_value: ' +
          paramInfo['max_value'] +
          ')'
      }
    } else if (paramType === 'string') {
      if (paramInfo['max_length']) {
        paramDescription += ' (max_length: ' +
          paramInfo['max_length'] +
          ')'
      }
    } else if (paramType === 'reference') {
      if (paramInfo['field_type_data']) {
        paramDescription += ' (multiple: ' +
          paramInfo['field_type_data']['multiple'] +
          ')'
      }
    }

    annotation.push(' * @apiParam {' + paramType + '} ' + paramLabel + '  ' + paramDescription)
  })

  annotation.push(' * @apiExample {js} ex:\noctane.' + section + '.' + funcName + '({ ... });')

  return annotation.join('\n') + '\n */\n\n'
}

function saveApiAnnotationsToFile (annotations, file) {
  console.log('saving annotations to ' + file + ' ...')
  try {
    fs.writeFileSync(
      path.join(__dirname, file),
      annotations
    )
  } catch (ex) {
    console.log(ex)
    process.exit(1)
  }
}

generateAPIAnnotations()
