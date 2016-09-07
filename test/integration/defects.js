/* eslint-env mocha */

'use strict'

var assert = require('assert')

var Query = require('../../lib/query')

var initializeOctaneClient = require('./helper').initializeOctaneClient

describe('[defects]', function () {
  this.timeout(60000)

  var client
  var defectID
  var defectName = 'defect test'

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
    client.defects.getAll({limit: 2}, function (err, defects) {
      assert.equal(err, null)
      assert(defects.meta.total_count >= 0)
      done()
    })
  })

  it('should successfully get defects list with limit', function (done) {
    client.defects.getAll({limit: 10}, function (err, defects) {
      assert.equal(err, null)
      if (defects.length === 10) {
        assert(defects.meta.total_count >= 10)
      } else {
        assert(defects.length === defects.meta.total_count)
      }
      done()
    })
  })

  it('should successfully get defects list with filter', function (done) {
    var q = Query.field('severity').equal(Query.field('name').equal('severity'))
    client.defects.getAll({query: q}, function (err, defects) {
      assert.equal(err, null)
      defects.forEach(function (defect) {
        assert.strictEqual(defect.severity.name, 'Low')
      })
      done()
    })
  })

  it('should successfully get defects list with order', function (done) {
    client.defects.getAll({order_by: 'id'}, function (err, defects) {
      assert.equal(err, null)
      for (var i = 1, l = defects.length; i < l; i++) {
        assert(defects[i - 1].id < defects[i].id)
      }
      done()
    })
  })

  it('should successfully create a defect', function (done) {
    client.workItemRoots.getAll({limit: 1}, function (err, workItemRoots) {
      assert.equal(err, null)
      assert.equal(workItemRoots.length, 1)
      var workItemRoot = workItemRoots[0]

      client.severities.getAll({}, function (err, severities) {
        assert.equal(err, null)
        assert(severities.length > 0)
        var severity = severities[0]

        var q = Query.field('entity').equal('defect')
        client.phases.getAll({query: q}, function (err, phases) {
          assert.equal(err, null)
          assert(phases.length > 0)
          var phase = phases[0]

          var defect = {
            name: defectName,
            parent: workItemRoot,
            severity: severity,
            phase: phase
          }
          client.defects.create(defect, function (err, defect) {
            assert.equal(err, null)
            assert(defect.id)

            defectID = defect.id
            done()
          })
        })
      })
    })
  })

  it('should successfully get a defect', function (done) {
    client.defects.get({id: defectID}, function (err, defect) {
      assert.equal(err, null)
      assert(defect)

      assert.strictEqual(defect.name, defectName)
      done()
    })
  })

  it('should successfully update a defect', function (done) {
    var name = 'defect test updated'
    client.defects.update({id: defectID, name: name}, function (err, defect) {
      assert.equal(err, null)
      assert(defect)

      assert.strictEqual(defect.name, name)
      done()
    })
  })

  it('should successfully delete a defect', function (done) {
    client.defects.delete({id: defectID}, function (err, defect) {
      assert.equal(err, null)
      done()
    })
  })
})
