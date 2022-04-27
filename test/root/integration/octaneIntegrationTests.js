/*!
* (c) Copyright 2020 - 2022 Micro Focus or one of its affiliates.
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
  let configObject
  before(function adaptGenerateRoutesConfigFileToRootConfigFile () {
    configObject = convertToRootConfig()
    octane = new Octane(configObject)
  })
  describe('makes successful CRUD operations', () => {
    const numberOfCreatedDefects = 10

    function assertIdListsMatch (receivedIds, expectedIds) {
      for (let i = 0; i < expectedIds.length; i++) {
        assert.strictEqual(receivedIds[i], expectedIds[i])
      }
    }

    async function deleteDefectsWithIds (idsToDelete) {
      if (idsToDelete !== undefined && idsToDelete.length > 0) {
        const deletedDefects = await octane.delete(defectEntityName).query(Query.field('id').inComparison(idsToDelete).build()).execute()
        assert.strictEqual(deletedDefects.total_count, idsToDelete.length)
        const deletedIds = deletedDefects.data.map(deletedEntity => deletedEntity.id)
        deletedIds.sort()
        assertIdListsMatch(deletedIds, idsToDelete)
      }
    }

    async function createDefects (numberOfDefects) {
      const defects = []
      for (let i = 1; i <= numberOfDefects; i++) {
        // noinspection HtmlRequiredLangAttribute
        defects.push({
          name: 'My Test Defect ' + Math.random(),
          description: `<html><body>\n This is the test ${i} ${Math.random()} \n</body></html>`
        })
      }
      const createdDefects = await octane.create(defectEntityName, defects).execute()
      assert.strictEqual(createdDefects.total_count, numberOfDefects)
      for (let i = 0; i < numberOfDefects; i++) {
        defects[i].id = createdDefects.data[i].id
      }

      return defects
    }

    describe('create operations', function () {
      const createdIds = []
      it('creates single defects', async () => {
        const createdSingleDefect = await octane.create(defectEntityName, { name: 'My Test Defect 0' }).execute()
        assert.strictEqual(createdSingleDefect.total_count, 1)
        createdIds.push(createdSingleDefect.data[0].id)
      })
      it('creates multiple defects', async function () {
        this.timeout(2000).slow(750)
        const newDefects = await createDefects(numberOfCreatedDefects)
        newDefects.map(defect => createdIds.push(defect.id))
      })

      after(async function () {
        this.timeout(10000).slow(4000)
        await deleteDefectsWithIds(createdIds)
      })
    })

    describe('operations requiring setup and cleanup', () => {
      const defectIds = []
      let defectSingleId
      let defects
      before(async function () {
        defects = await createDefects(numberOfCreatedDefects)
        defects.map(defect => defectIds.push(defect.id))
        defectSingleId = defectIds[0]
      })

      describe('read operations', () => {
        it('get single defects', async () => {
          const gotSingleDefect = await octane.get(defectEntityName).at(defectSingleId).execute()
          assert.strictEqual(gotSingleDefect.id, defectSingleId)
        })
        describe('on multiple defects', () => {
          it('gets all created defects', async () => {
            const gotDefects = await octane.get(defectEntityName).orderBy('id').query(
              Query.field('id').inComparison(defectIds).build()).execute()
            assert.strictEqual(gotDefects.total_count, numberOfCreatedDefects)
            const receivedIds = gotDefects.data.map(data => data.id)
            assertIdListsMatch(receivedIds, defectIds)
          })
          it('gets the defect when using all possible get all request parameters', async () => {
            const limit = Math.floor(defectIds.length / 2)
            const offset = 1
            const expectedIds = []
            const expectedDefects = []
            defects.sort((d1, d2) => d1.name > d2.name ? 1 : -1)
            for (let i = offset; i < offset + limit; i++) {
              expectedIds.push(defects[i].id)
              expectedDefects.push(defects[i])
            }

            const gotDefects = await octane.get(defectEntityName)
              .query(Query.field('id').inComparison(defectIds).build())
              .limit(limit)
              .offset(offset)
              .fields('name', 'description')
              .orderBy('name')
              .execute()
            assert.strictEqual(gotDefects.total_count, defectIds.length)
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
            .at(defectSingleId).execute()
          assert(updatedDefect.id, defectSingleId)
          const gotUpdatedDefect = await octane.get(defectEntityName).at(updatedDefect.id).fields('name').execute()
          assert(gotUpdatedDefect.name, defectUpdate.name)
        })
        it('updates single defect with id', async () => {
          const defectUpdate = { id: defectSingleId, name: 'Update 0 With Id' }
          const updateSingleDefect = await octane.update(defectEntityName, defectUpdate).execute()
          assert(updateSingleDefect.id, defectSingleId)
          const gotUpdatedDefect = await octane.get(defectEntityName).at(updateSingleDefect.id).fields('name').execute()
          assert(gotUpdatedDefect.name, defectUpdate.name)
        })
        it('updates multiple defects', async () => {
          const defectsToUpdate = []
          defectIds.sort()
          defectIds.map((id) => {
            defectsToUpdate.push({
              name: 'Update ' + Math.random(),
              id: id
            })
          })
          const updateDefects = await octane.updateBulk(defectEntityName, defectsToUpdate).execute()
          const receivedIds = updateDefects.data.map(data => data.id)
          assertIdListsMatch(receivedIds, defectIds)
          const gotUpdatedDefect = await octane.get(defectEntityName).fields('name')
            .query(Query.field('id').inComparison(receivedIds).build())
            .orderBy('id')
            .execute()
          for (let i = 0; i < receivedIds.length; i++) { assert(gotUpdatedDefect.data[i].name, defectsToUpdate[i].name) }
        })
      })
      after(async function () {
        this.timeout(10000).slow(4000)
        await deleteDefectsWithIds(defectIds)
      })
    })

    describe('delete operations', () => {
      const defectIds = []
      let defectSingleId

      before(async function () {
        const newDefects = await createDefects(numberOfCreatedDefects + 1)
        newDefects.map(defect => defectIds.push(defect.id))
        defectSingleId = defectIds.pop()
      })

      it('deletes single defects', async () => {
        const deleteSingleDefect = await octane.delete(defectEntityName).at(defectSingleId).execute()
        assert.strictEqual(deleteSingleDefect, undefined)
      })
      it('deletes multiple defects', async function () {
        this.timeout(10000).slow(4000)
        await deleteDefectsWithIds(defectIds)
      })
    })

    describe('custom operation', () => {
      it('sends request for users with custom header', async () => {
        const url = '/api/shared_spaces/' + configObject.sharedSpace + '/users'
        await assert.doesNotReject(octane.executeCustomRequest(url, Octane.operationTypes.get, undefined, { 'ALM-OCTANE-TECH-PREVIEW': true }))
        const users = await octane.executeCustomRequest(url, Octane.operationTypes.get, undefined, { 'ALM-OCTANE-TECH-PREVIEW': true })
        assert.ok(users.data.length > 0)
      })
      it('fails on not supported operation', async () => {
        const url = '/api/shared_spaces/' + configObject.sharedSpace + '/users'
        await assert.rejects(octane.executeCustomRequest(url, 'someRandomOp', undefined, { 'ALM-OCTANE-TECH-PREVIEW': true }), new Error('Operation is not supported'))
      })
    })
  })
})
