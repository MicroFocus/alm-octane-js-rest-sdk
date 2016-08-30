/* eslint-env mocha */

'use strict'

var assert = require('assert')

// var Client = require('../../lib')
var initializeOctaneClient = require('./helper').initializeOctaneClient

describe('[phases]', function () {
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

  it('should successfully get all phases list', function (done) {
    client.phases.getAll({}, function (err, phases) {
      assert.equal(err, null)
      assert(phases.meta.total_count > 0)
      done()
    })
  })

  it('should successfully get phases list with limit', function (done) {
    client.phases.getAll({limit: 10}, function (err, phases) {
      assert.equal(err, null)
      if (phases.length === 10) {
        assert(phases.meta.total_count >= 10)
      } else {
        assert(phases.length === phases.meta.total_count)
      }
      done()
    })
  })

  it('should successfully get phases list with filter', function (done) {
    client.phases.getAll({query: '"entity EQ ^defect^"'}, function (err, phases) {
      assert.equal(err, null)
      phases.forEach(function (phase) {
        assert.strictEqual(phase.entity, 'defect')
      })
      done()
    })
  })

  it('should successfully get phases list with order', function (done) {
    client.phases.getAll({order_by: 'id'}, function (err, phases) {
      assert.equal(err, null)
      for (var i = 1, l = phases.length; i < l; i++) {
        assert(phases[i - 1].id < phases[i].id)
      }
      done()
    })
  })

  it('should successfully create/get/update/delete a phase', function (done) {
    var phase = {
      name: 'phase test 1'
    }
    client.phases.create(phase, function (err, phase) {
      assert.equal(err, null)
      assert(phase.id)

      var phaseId = phase.id
      client.phases.get({phase_id: phaseId}, function (err, phase) {
        assert.equal(err, null)
        assert.strictEqual(phase.id, phaseId)

        client.phases.update({phase_id: phaseId, description: 'phase test 1 desc'}, function (err, phase) {
          assert.equal(err, null)
          assert.strictEqual(phase.description, 'phase test 1 desc')

          client.phases.delete({phase_id: phaseId}, function (err) {
            assert.equal(err, null)

            done()
          })
        })
      })
    })
  })
})
