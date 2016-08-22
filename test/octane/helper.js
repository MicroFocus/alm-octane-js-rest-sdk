/* eslint-env mocha */

'use strict'

var fs = require('fs')
var path = require('path')

var Client = require('../../lib')

exports.initializeOctaneClient = function (callback) {
  var client
  var config

  try {
    config = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, '../../test.json'),
        'utf8'
      )
    )
  } catch (ex) {
    return callback(ex)
  }

  try {
    client = new Client(config.config)
  } catch (ex) {
    return callback(ex)
  }

  client.authenticate(config.options, function (err) {
    if (err) {
      return callback(err)
    }

    callback(null, client)
  })
}
