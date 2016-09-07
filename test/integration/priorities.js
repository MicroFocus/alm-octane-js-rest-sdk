/* eslint-env mocha */

'use strict'

var assert = require('assert')

var initializeOctaneClient = require('./helper').initializeOctaneClient

describe('[priorities]', function () {
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

  it('should successfully get all priorities list', function (done) {
    client.priorities.getAll({}, function (err, priorities) {
      assert.equal(err, null)
      priorities.forEach(function (priority) {
        assert(priority.logical_name.startsWith('list_node.priority.'))
      })
      done()
    })
  })
})
