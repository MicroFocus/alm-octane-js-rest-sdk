/* eslint-env mocha */

'use strict'

var assert = require('assert')

// var Client = require('../../lib')
var initializeOctaneClient = require('./helper').initializeOctaneClient

describe('[work_items]', function () {
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

  it('should successfully get all work items list', function (done) {
    client.workItems.getAll({}, function (err, workItems) {
      assert.equal(err, null)
      assert(workItems.meta.total_count > 0)
      done()
    })
  })

  it('should successfully get work items list with limit', function (done) {
    client.workItems.getAll({limit: 10}, function (err, workItems) {
      assert.equal(err, null)
      if (workItems.length === 10) {
        assert(workItems.meta.total_count >= 10)
      } else {
        assert(workItems.length === workItems.meta.total_count)
      }
      done()
    })
  })

  it('should successfully get work items list with filter', function (done) {
    client.workItems.getAll({query: '"severity EQ {name EQ ^Low^}"'}, function (err, workItems) {
      assert.equal(err, null)
      workItems.forEach(function (workItem) {
        assert.strictEqual(workItem.severity.name, 'Low')
      })
      done()
    })
  })

  it('should successfully get work items list with order', function (done) {
    client.workItems.getAll({order_by: 'id'}, function (err, workItems) {
      assert.equal(err, null)
      for (var i = 1, l = workItems.length; i < l; i++) {
        assert(workItems[i - 1].id < workItems[i].id)
      }
      done()
    })
  })
})
