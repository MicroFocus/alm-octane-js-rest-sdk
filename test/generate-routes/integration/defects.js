/*!
 * (c) Copyright 2020 Micro Focus or one of its affiliates.
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

const assert = require('assert')

const Query = require('../../../lib/query')

const initializeOctaneClient = require('./helper').initializeOctaneClient

describe('[defects]', function () {
  this.timeout(60000)
  this.slow(400)
  const defectName = 'defect test'

  let client
  let defectIDs
  let workItemRoot
  let allSeverities
  let allPhases

  before('initialize the Octane client', function (done) {
    const self = this
    let msg

    initializeOctaneClient(function (err, aClient) {
      if (err) {
        msg = err.message
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

  function createFiveDefects (callback) {
    client.workItemRoots.getAll({ limit: 1 }, function (err, workItemRoots) {
      assert.strictEqual(err, null)
      assert.strictEqual(workItemRoots.length, 1)
      workItemRoot = workItemRoots[0]

      client.severities.getAll({}, function (err, severities) {
        assert.strictEqual(err, null)
        assert(severities.length > 0)
        allSeverities = severities

        const q = Query.field('entity').equal('defect')
        client.phases.getAll({ query: q }, function (err, phases) {
          assert.strictEqual(err, null)
          assert(phases.length > 0)
          allPhases = phases

          const defects = []
          for (let loop = 0; loop < 5; ++loop) {
            defects[loop] = {
              name: 'defect' + loop,
              parent: workItemRoot,
              severity: allSeverities[loop],
              phase: allPhases[loop]
            }
          }
          client.defects.createBulk(defects, function (err, defects) {
            assert.strictEqual(err, null)
            assert(defects)

            defectIDs = defects.data.map(defect => defect.id)
            callback()
          })
        })
      })
    })
  }

  it('should successfully create and delete a defect', function (done) {
    const defect = {
      name: defectName,
      parent: workItemRoot,
      severity: allSeverities[0],
      phase: allPhases[0]
    }
    client.defects.create(defect, function (err, defect) {
      assert.strictEqual(err, null)
      assert(defect.id)
      client.defects.delete({ id: defect.id }, function (err) {
        assert.strictEqual(err, null)
        done()
      })
    })
  }).slow(800)

  it('should successfully get a defect', function (done) {
    client.defects.get({ id: defectIDs[0] }, function (err, defect) {
      assert.strictEqual(err, null)
      assert(defect)
      assert(defect.name)
      done()
    })
  })

  it('should successfully update a defect', function (done) {
    const name = 'defect test updated' + Math.floor((Math.random() * 100) + 1)
    client.defects.update({ id: defectIDs[0], name: name }, function (err, defect) {
      assert.strictEqual(err, null)
      assert(defect)

      client.defects.get({ id: defectIDs[0], fields: 'name' }, function (err, defect) {
        assert.strictEqual(err, null)
        assert.strictEqual(defect.name, name)
        done()
      })
    })
  })

  it('should successfully update two defects', function (done) {
    const name1 = 'defect1 test updated' + Math.floor((Math.random() * 100) + 1)
    const name2 = 'defect2 test updated' + Math.floor((Math.random() * 100) + 1)
    client.defects.updateBulk([{ id: defectIDs[0], name: name1 }, {
      id: defectIDs[1],
      name: name2
    }], function (err, defect) {
      assert.strictEqual(err, null)
      assert(defect)

      client.defects.get({ id: defectIDs[0], fields: 'name' }, function (err, defect) {
        assert.strictEqual(err, null)
        assert.strictEqual(defect.name, name1)

        client.defects.get({ id: defectIDs[1], fields: 'name' }, function (err, defect) {
          assert.strictEqual(err, null)
          assert.strictEqual(defect.name, name2)
          done()
        })
      })
    })
  })

  it('should successfully get all defects list', function (done) {
    client.defects.getAll({}, function (err, defects) {
      assert.strictEqual(err, null)
      assert(defects.meta.total_count > 0)
      assert(defects.length > 0)
      done()
    })
  })

  it('should successfully get defects list with limit', function (done) {
    client.defects.getAll({ limit: 3 }, function (err, defects) {
      assert.strictEqual(err, null)
      assert(defects.meta.total_count > 0)
      assert(defects.length === 3)
      done()
    })
  })

  it('should successfully get defects list with filter', function (done) {
    const q = Query.field('severity').equal(Query.field('id').equal('severity'))
    client.defects.getAll({ query: q }, function (err, defects) {
      assert.strictEqual(err, null)
      defects.forEach(function (defect) {
        assert.strictEqual(defect.severity.name, 'Low')
      })
      done()
    })
  })

  it('should successfully get defects list with order', function (done) {
    client.defects.getAll({ order_by: 'id' }, function (err, defects) {
      assert.strictEqual(err, null)
      for (let i = 1, l = defects.length; i < l; i++) {
        assert(defects[i - 1].id < defects[i].id)
      }
      done()
    })
  })

  after('Delete all created defects', function (done) {
    client.defects.getAll({
      fields: 'id',
      query: Query.field('id').inComparison(defectIDs)
    }, function (err, defects) {
      assert.strictEqual(err, null)
      const promises = []
      for (const defect of defects) {
        const id = defect.id
        promises.push(new Promise(function (resolve) {
          client.defects.delete({ id: id }, function () {
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
