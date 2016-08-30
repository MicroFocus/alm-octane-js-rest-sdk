/* eslint-env mocha */

'use strict'

var assert = require('assert')

// var Client = require('../../lib')
var initializeOctaneClient = require('./helper').initializeOctaneClient

describe('[list_nodes]', function () {
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

  it('should successfully get all list nodes list', function (done) {
    client.listNodes.getAll({}, function (err, listNodes) {
      assert.equal(err, null)
      assert(listNodes.meta.total_count > 0)
      done()
    })
  })

  it('should successfully get list nodes list with limit', function (done) {
    client.listNodes.getAll({limit: 10}, function (err, listNodes) {
      assert.equal(err, null)
      if (listNodes.length === 10) {
        assert(listNodes.meta.total_count >= 10)
      } else {
        assert(listNodes.length === listNodes.meta.total_count)
      }
      done()
    })
  })

  it('should successfully get list nodes list with filter', function (done) {
    client.listNodes.getAll({query: '"list_root EQ {name EQ ^Severity^}"'}, function (err, listNodes) {
      assert.equal(err, null)
      listNodes.forEach(function (listNode) {
        assert.strictEqual(listNode.list_root.name, 'Severity')
      })
      done()
    })
  })

  it('should successfully get list nodes list with order', function (done) {
    client.listNodes.getAll({order_by: 'id'}, function (err, listNodes) {
      assert.equal(err, null)
      for (var i = 1, l = listNodes.length; i < l; i++) {
        assert(listNodes[i - 1].id < listNodes[i].id)
      }
      done()
    })
  })
})
