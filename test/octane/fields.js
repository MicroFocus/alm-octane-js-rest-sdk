/* eslint-env mocha */

'use strict'

var assert = require('assert')

// var Client = require('../../lib')
var initializeOctaneClient = require('./helper').initializeOctaneClient

describe('[metadata/fields]', function () {
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

  it('should successfully execute GET /metadata/fields', function (done) {
    client.fields.getAll({}, function (err, fields) {
      assert.equal(err, null)
      assert(fields.meta.total_count > 0)
      done()
    })
  })

  it('should successfully execute GET /metadata/fields with filter', function (done) {
    client.fields.getAll({query: '"entity_name EQ ^defect^"'}, function (err, fields) {
      assert.equal(err, null)
      fields.forEach(function (field) {
        assert.strictEqual(field.entity_name, 'defect')
      })
      done()
    })
  })
})
