/* eslint-env mocha */

'use strict'

var assert = require('assert')

// var Client = require('../../lib')
var initializeOctaneClient = require('./helper').initializeOctaneClient

describe('[defects]', function () {
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

  it('should successfully get all defects list', function (done) {
    client.defects.getAll({}, function (err, defects) {
      assert.equal(err, null)
      assert(defects.meta.total_count > 0)
      done()
    })
  })

  it('should successfully create/get/update/delete a defect', function (done) {
    var defect = {
      name: 'defect test 1',
      parent: {
        type: 'work_item_root',
        id: 1001
      },
      severity: {
        type: 'list_node',
        id: 1002
      },
      phase: {
        type: 'phase',
        id: 1001
      }
    }
    client.defects.create(defect, function (err, defect) {
      assert.equal(err, null)
      assert(defect.id)

      var defectId = defect.id
      client.defects.get({defect_id: defectId}, function (err, defect) {
        assert.equal(err, null)
        assert.equal(defect.id, defectId)

        client.defects.update({defect_id: defectId, name: 'defect test 1.1'}, function (err, defect) {
          assert.equal(err, null)
          assert.strictEqual(defect.name, 'defect test 1.1')

          client.defects.delete({defect_id: defectId}, function (err, defect) {
            assert.equal(err, null)
            assert.equal(defect, null)

            done()
          })
        })
      })
    })
  })
})
