/* eslint-env mocha */

'use strict'

var assert = require('assert')

var Query = require('../../lib/query')

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

  it('should successfully get all entities list', function (done) {
    client.metadata.getEntities({}, function (err, entities) {
      assert.equal(err, null)
      assert(entities.meta.total_count > 0)
      done()
    })
  })

  it('should successfully get entities list with filter', function (done) {
    var q = Query.field('name').equal('defect')
    client.metadata.getEntities({query: q}, function (err, entities) {
      assert.equal(err, null)
      assert.strictEqual(entities.meta.total_count, 1)
      done()
    })
  })
})

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

  it('should successfully get all fields list', function (done) {
    client.metadata.getFields({}, function (err, fields) {
      assert.equal(err, null)
      assert(fields.meta.total_count > 0)
      done()
    })
  })

  it('should successfully get fields list with filter', function (done) {
    var q = Query.field('entity_name').equal('defect')
    client.metadata.getFields({query: q}, function (err, fields) {
      assert.equal(err, null)
      fields.forEach(function (field) {
        assert.strictEqual(field.entity_name, 'defect')
      })
      done()
    })
  })
})
