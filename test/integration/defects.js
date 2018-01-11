/*!
 * (c) 2016-2018 EntIT Software LLC, a Micro Focus company
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
*/

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
  var workItemRoot
  var allSeverities
  var allPhases

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

        try {
          createFiveDefects(function () {
            done()
          })
        } catch (error) {
          msg = err.message
          console.log('Aborted - %s',
            typeof msg === 'string' ? msg : JSON.stringify(msg)
          )
          self.skip()
        }
      }
    })
  })

  function createFiveDefects(callback) {
    client.workItemRoots.getAll({limit: 1}, function (err, workItemRoots) {
      assert.equal(err, null)
      assert.equal(workItemRoots.length, 1)
      workItemRoot = workItemRoots[0]

      client.severities.getAll({}, function (err, severities) {
        assert.equal(err, null)
        assert(severities.length > 0)
        allSeverities = severities

        var q = Query.field('entity').equal('defect')
        client.phases.getAll({query: q}, function (err, phases) {
          assert.equal(err, null)
          assert(phases.length > 0)
          allPhases = phases

          for (var loop = 0; loop < 5; ++loop) {
            var defect = {
              name: 'defect' + loop,
              parent: workItemRoot,
              severity: allSeverities[loop],
              phase: allPhases[loop]
            }
            client.defects.create(defect, function (err, defect) {
              assert.equal(err, null)
              assert(defect.id)
            })
          }
          callback();
        })
      })
    })
  }

  it('should successfully create a defect', function (done) {
    var defect = {
      name: defectName,
      parent: workItemRoot,
      severity: allSeverities[0],
      phase: allPhases[0]
    }
    client.defects.create(defect, function (err, defect) {
      assert.equal(err, null)
      assert(defect.id)

      defectID = defect.id
      done()
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

      client.defects.get({id: defectID, fields: 'name'}, function (err, defect) {
        assert.strictEqual(defect.name, name)
        done()
      })
    })
  })

  it('should successfully delete a defect', function (done) {
    client.defects.delete({id: defectID}, function (err, defect) {
      assert.equal(err, null)
      done()
    })
  })

  it('should successfully get all defects list', function (done) {
    client.defects.getAll({}, function (err, defects) {
      assert.equal(err, null)
      assert(defects.meta.total_count === 5)
      done()
    })
  })

  it('should successfully get defects list with limit', function (done) {
    client.defects.getAll({limit: 3}, function (err, defects) {
      assert.equal(err, null)
      assert(defects.meta.total_count === 5)
      assert(defects.length === 3)
      done()
    })
  })

  it('should successfully get defects list with filter', function (done) {
    var q = Query.field('severity').equal(Query.field('id').equal('severity'))
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

  after('Delete all defects', function (done) {
    client.defects.getAll({fields: 'id'}, function (err, defects) {
      assert.equal(err, null)
      var promises = []
      for (var defect of defects) {
        promises.push(new Promise(function (resolve) {
          client.defects.delete({id: defect.id}, function () {
            resolve()
          })
        }))
      }
      Promise.all(promises).then(function () {
        done()
      })
    })
  })
})
