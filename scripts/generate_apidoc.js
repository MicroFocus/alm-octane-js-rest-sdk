'use strict'

var fs = require('fs')
var path = require('path')

var utils = require('../lib/utils')

var defines
var apiDocs

function generateAPIDoc () {
  var routesPath = path.join(__dirname, '../lib/routes.json')
  var routes = JSON.parse(fs.readFileSync(routesPath, 'utf8'))

  if (!routes.defines) {
    console.log('No route defined')
    process.exit(1)
  }

  console.log('Generating...')

  defines = routes.defines
  delete routes.defines
  apiDocs = ''

  console.log('Converting routes to functions')
  prepareApi(routes)

  var apiDocsPath = path.join(__dirname, '../doc', 'apidoc.js')
  fs.writeFileSync(apiDocsPath, apiDocs)
}

function prepareApi (struct, baseType) {
  if (!baseType) {
    baseType = ''
  }

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

      apiDocs += createApiDocument(section, funcName, block)
    } else {
      prepareApi(block, messageType)
    }
  })
}

function createApiDocument (section, funcName, block) {
  var url = block['url']
  var method = block['method'].toLowerCase()
  var description = block['description']

  var documentLines = [
    '/**',
    ' * @api {' + method + '} ' + url + ' ' + funcName,
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

    var paramInfoA = paramsObj[paramA] || defines['params'][cleanParamA]
    var paramInfoB = paramsObj[paramB] || defines['params'][cleanParamB]

    var paramRequiredA = paramInfoA['required']
    var paramRequiredB = paramInfoB['required']

    if (paramRequiredA && !paramRequiredB) return -1
    if (!paramRequiredA && paramRequiredB) return 1
    return 0
  })

  paramKeys.forEach(function (param) {
    var cleanParam = param.replace(/^\$/, '')
    var paramInfo = paramsObj[param] || defines['params'][cleanParam]

    var paramRequired = paramInfo['required']
    var paramType = paramInfo['type']
    var paramDescription = paramInfo['description']
    var paramDefaultVal = paramInfo['default']

    var paramLabel = cleanParam

    if (typeof paramDefaultVal !== 'undefined') {
      paramLabel += '=' + paramDefaultVal
    }

    if (!paramRequired) {
      paramLabel = '[' + paramLabel + ']'
    }

    documentLines.push(' * @apiParam {' + paramType + '} ' + paramLabel + '  ' + paramDescription)
  })

  documentLines.push(' * @apiExample {js} ex:\noctane.' + section + '.' + funcName + '({ ... });')

  return documentLines.join('\n') + '\n */\n\n'
}

generateAPIDoc()
