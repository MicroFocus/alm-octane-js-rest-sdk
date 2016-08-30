'use strict'

var fs = require('fs')
var path = require('path')

var Octane = require('../lib')
var utils = require('../lib/utils')

var OCTANE_CONFIG_FILE = '../octane.json'
var META_ROUTES_FILE = '../routes/meta.json'
var DEFAULT_ROUTES_FILE = '../routes/default.json'

function generateDefaultRoutes () {
  initializeOctaneClient(function (err, client) {
    if (err) {
      console.error(err)
      process.exit(1)
    }

    loadOcatneMetadata(client, function (err, metadata) {
      if (err) {
        console.error(err)
        process.exit(1)
      }

      var routes = initializeRoutes(META_ROUTES_FILE)

      createRoutesFromOctaneMetadata(routes, metadata)

      saveRoutesToFile(routes, DEFAULT_ROUTES_FILE)

      // var routes = createDefaultRoutes(metadata)

      // saveDefaultRoutes(routes)
    })
  })
}

function initializeOctaneClient (callback) {
  var client
  var configuration

  console.log('loading Ocatne configuration ...')
  try {
    configuration = JSON.parse(
      fs.readFileSync(path.join(__dirname, OCTANE_CONFIG_FILE), 'utf8')
    )
  } catch (ex) {
    return callback(ex)
  }

  console.log('initializing Octane client ...')
  try {
    client = new Octane(configuration.config)
  } catch (ex) {
    return callback(ex)
  }

  client.authenticate(configuration.options, function (err) {
    if (err) {
      return callback(err)
    }

    callback(null, client)
  })
}

function loadOcatneMetadata (client, callback) {
  var metadata = {}

  console.log('loading entity metadata ...')
  client.metadata.getEntities({}, function (err, entities) {
    if (err) {
      return callback(err)
    }

    console.log('loading field metadata ...')
    client.metadata.getFields({}, function (err, fields) {
      if (err) {
        return callback(err)
      }

      metadata.entities = entities
      metadata.fields = fields
      callback(null, metadata)
    })
  })
}

function initializeRoutes (routesFile) {
  console.log('initializing routes from ' + routesFile + ' ...')
  try {
    return JSON.parse(
      fs.readFileSync(path.join(__dirname, routesFile), 'utf8')
    )
  } catch (ex) {
    console.error(ex)
    process.exit(1)
  }
}

function createRoutesFromOctaneMetadata (routes, metadata) {
  metadata.entities.forEach(function (entity) {
    var name = entity.name
    var fields = metadata.fields.filter(function (field) {
      return field.entity_name === name
    })

    var route = createRoute(entity, fields)

    if (route) {
      routes[utils.toDisplayName(name, true)] = route
    }
  })
}

function createRoute (entity, fields) {
  var route
  var name = entity.name

  console.log('creating route for ' + name + ' ...')
  entity.features.forEach(function (feature) {
    if (feature.name === 'rest') {
      route = {}

      var url = feature.url
      var methods = feature.methods
      var params

      if (methods.indexOf('GET') > -1) {
        route['get-all'] = {
          url: '/' + url,
          method: 'GET',
          params: {
            $query: null,
            $limit: null,
            $offset: null,
            $fields: null,
            $order_by: null
          },
          description: 'Gets ' + utils.toDisplayName(name, true) + ' list.'
        }

        route['get'] = {
          url: '/' + url + '/:id',
          method: 'GET',
          params: {
            $id: null,
            $fields: null
          },
          description: 'Gets a single ' + utils.toDisplayName(name) + '.'
        }
      }

      if (methods.indexOf('POST') > -1) {
        params = parseParameters(fields, true)
        route['create'] = {
          url: '/' + url,
          method: 'POST',
          params: params,
          description: 'Create a single ' + utils.toDisplayName(name) + '.'
        }
      }

      if (methods.indexOf('PUT') > -1) {
        params = parseParameters(fields, false)
        params['$id'] = null
        route['update'] = {
          url: '/' + url + '/:id',
          method: 'PUT',
          params: params,
          description: 'Update a single ' + utils.toDisplayName(name) + '.'
        }
      }

      if (methods.indexOf('DELETE') > -1) {
        route['delete'] = {
          url: '/' + url + '/:id',
          method: 'DELETE',
          params: {
            $id: null
          },
          description: 'Delete a single ' + utils.toDisplayName(name) + '.'
        }
      }
    }
  })

  return route
}

function parseParameters (fields, isForCreate) {
  var params = {}

  fields.forEach(function (field) {
    var name = field.name
    var label = field.label
    var type = field.field_type

    var required = field.required
    var editable = field.editable
    var final = field.final

    if (!editable) {
      return
    }
    if (final && !isForCreate) {
      return
    }

    params[name] = {
      type: type,
      required: isForCreate ? required : false,
      description: label
    }

    if (type === 'integer') {
      params[name]['min_value'] = field.min_value
      params[name]['max_value'] = field.max_value
    } else if (type === 'string') {
      params[name]['max_length'] = field.max_length
    } else if (type === 'reference') {
      params[name]['field_type_data'] = field.field_type_data
    }
  })

  return params
}

function saveRoutesToFile (routes, file) {
  console.log('saving routes to ' + file + ' ...')
  try {
    fs.writeFileSync(
      path.join(__dirname, file),
      JSON.stringify(routes, null, '\t')
    )
  } catch (ex) {
    console.log(ex)
    process.exit(1)
  }
}

generateDefaultRoutes()
