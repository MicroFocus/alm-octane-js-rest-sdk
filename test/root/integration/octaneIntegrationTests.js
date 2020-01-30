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
const Octane = require('../../../lib/root/octane')
const defectEntityName = Octane.entityTypes.defects
const Query = require('../../../lib/query')
const convertToRootConfig = require('./octaneConfigConverter').convertToRootConfig

describe('octane', function () {
  this.slow(350)
  let octane
  before(function adaptGenerateRoutesConfigFileToRootConfigFile () {
    const configObject = convertToRootConfig()
    octane = new Octane(configObject)
  })
  describe('makes successful CRUD operations', () => {
    const numberOfCreatedDefects = 10
    const createdIds = []
    let createdSingleId
    const defects = []
    for (let i = 1; i <= numberOfCreatedDefects; i++) {
      // noinspection HtmlRequiredLangAttribute
      defects.push({
        name: 'My Test Defect ' + Math.random(),
        description: `<html><body>\n This is the test ${i} ${Math.random()} \n</body></html>`
      })
    }

    describe('create operations', () => {
      it('creates single defects', async () => {
        const createdSingleDefect = await octane.create(defectEntityName, { name: 'My Test Defect 0' }).execute()
        assert.strictEqual(createdSingleDefect.total_count, 1)
        createdSingleId = createdSingleDefect.data[0].id
      })
      it('creates multiple defects', async () => {
        const createdDefects = await octane.create(defectEntityName, defects).execute()
        assert.strictEqual(createdDefects.total_count, numberOfCreatedDefects)

        createdDefects.data.map(createdObject => { createdIds.push(createdObject.id) })
        createdIds.sort()
        for (let i = 0; i < numberOfCreatedDefects; i++) {
          defects[i].id = createdDefects.data[i].id
        }
      }).slow(750)
    })

    function assertIdListsMatch (receivedIds, expectedIds) {
      for (let i = 0; i < expectedIds.length; i++) {
        assert.strictEqual(receivedIds[i], expectedIds[i])
      }
    }

    function assertAllCreatedDefectsWereFound (returnedObjects) {
      assert.strictEqual(returnedObjects.total_count, createdIds.length)
    }

    describe('read operations', () => {
      it('get single defects', async () => {
        const gotSingleDefect = await octane.get(defectEntityName).at(createdSingleId).execute()
        assert.strictEqual(gotSingleDefect.id, createdSingleId)
      })
      describe('on multiple defects', () => {
        it('gets all created defects', async () => {
          const gotDefects = await octane.get(defectEntityName).orderBy('id').query(
            Query.field('id').inComparison(createdIds).build()).execute()
          assert.strictEqual(gotDefects.total_count, numberOfCreatedDefects)
          const receivedIds = gotDefects.data.map(data => data.id)
          assertIdListsMatch(receivedIds, createdIds)
        })
        it('gets the defect when using all possible get all request parameters', async () => {
          const limit = Math.floor(createdIds.length / 2)
          const offset = 1
          const expectedIds = []
          const expectedDefects = []
          defects.sort((d1, d2) => d1.name > d2.name ? 1 : -1)
          for (let i = offset; i < offset + limit; i++) {
            expectedIds.push(defects[i].id)
            expectedDefects.push(defects[i])
          }

          const gotDefects = await octane.get(defectEntityName)
            .query(Query.field('id').inComparison(createdIds).build())
            .limit(limit)
            .offset(offset)
            .fields('name', 'description')
            .orderBy('name')
            .execute()
          assertAllCreatedDefectsWereFound(gotDefects)
          assert.strictEqual(gotDefects.data.length, limit) // assert that the limit worked
          const receivedIds = gotDefects.data.map(data => data.id)
          for (let i = 0; i < gotDefects.data.length; i++) {
            assert.strictEqual(gotDefects.data[i].name, expectedDefects[i].name)
            assert.strictEqual(gotDefects.data[i].description, expectedDefects[i].description)
          }
          receivedIds.sort()
          expectedIds.sort()
          assertIdListsMatch(receivedIds, expectedIds)
        })
      })
    })

    describe('update operations', () => {
      it('updates single defect without id', async () => {
        const defectUpdate = { name: 'Update 0 No Id' }
        const updatedDefect = await octane.update(defectEntityName, defectUpdate)
          .at(createdSingleId).execute()
        assert(updatedDefect.id, createdSingleId)
        const gotUpdatedDefect = await octane.get(defectEntityName).at(updatedDefect.id).fields('name').execute()
        assert(gotUpdatedDefect.name, defectUpdate.name)
      })
      it('updates single defect with id', async () => {
        const defectUpdate = { id: createdSingleId, name: 'Update 0 With Id' }
        const updateSingleDefect = await octane.update(defectEntityName, defectUpdate).execute()
        assert(updateSingleDefect.id, createdSingleId)
        const gotUpdatedDefect = await octane.get(defectEntityName).at(updateSingleDefect.id).fields('name').execute()
        assert(gotUpdatedDefect.name, defectUpdate.name)
      })
      it('updates multiple defects', async () => {
        const defectsToUpdate = []
        createdIds.sort()
        createdIds.map((id) => {
          defectsToUpdate.push({
            name: 'Update ' + Math.random(),
            id: id
          })
        })
        const updateDefects = await octane.updateBulk(defectEntityName, defectsToUpdate).execute()
        const receivedIds = updateDefects.data.map(data => data.id)
        assertIdListsMatch(receivedIds, createdIds)
        const gotUpdatedDefect = await octane.get(defectEntityName).fields('name')
          .query(Query.field('id').inComparison(receivedIds).build())
          .orderBy('id')
          .execute()
        for (let i = 0; i < receivedIds.length; i++) { assert(gotUpdatedDefect.data[i].name, defectsToUpdate[i].name) }
      })
    })

    describe('delete operations', () => {
      it('deletes single defects', async () => {
        const deleteSingleDefect = await octane.delete(defectEntityName).at(createdSingleId).execute()
        assert.strictEqual(deleteSingleDefect, undefined)
      })
      it('deletes multiple defects', async () => {
        const deletedDefects = await octane.delete(defectEntityName).query(Query.field('id').inComparison(createdIds).build()).execute()
        assertAllCreatedDefectsWereFound(deletedDefects)
        const deletedIds = deletedDefects.data.map(deletedEntity => deletedEntity.id)
        deletedIds.sort()
        assertIdListsMatch(deletedIds, createdIds)
      }).timeout(10000).slow(4000)
    })
  })
})
