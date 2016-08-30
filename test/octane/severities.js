/* eslint-env mocha */

'use strict'

var assert = require('assert')

// var Client = require('../../lib')
var initializeOctaneClient = require('./helper').initializeOctaneClient

describe('[severities]', function () {
  this.timeout(60000)

  var client

  before('initialize the Octane client', function (done) {
    var self = this

    initializeOctaneClient(function (err, aClient) {
      if (err) {
        var msg = err.message
        console.log('Aborted - %s',
          typeof msg === 'string' ? msg : JSON.stringify(msg)
        )
        self.skip()
      } else {
        client = aClient
        done()
      }
    })
  })

  it('should successfully get all severities list', function (done) {
    client.severities.getAll({}, function (err, severities) {
      assert.equal(err, null)
      severities.forEach(function (severity) {
        assert(severity.logical_name.startsWith('list_node.severity.'))
      })
      done()
    })
  })
})
