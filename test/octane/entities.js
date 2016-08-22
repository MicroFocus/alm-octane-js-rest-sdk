/* eslint-env mocha */

'use strict'

var assert = require('assert')

// var Client = require('../../lib')
var initializeOctaneClient = require('./helper').initializeOctaneClient

describe('[metadata/entities]', function () {
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

  it('should successfully execute GET /metadat/entities', function (done) {
    client.entities.getAll({}, function (err, entities) {
      assert.equal(err, null)
      assert(entities.meta.total_count > 0)
      done()
    })
  })

  it('should successfully execute GET /metadat/entities with filter', function (done) {
    client.entities.getAll({query: '"name EQ ^defect^"'}, function (err, entities) {
      assert.equal(err, null)
      assert.strictEqual(entities.meta.total_count, 1)
      done()
    })
  })
})
