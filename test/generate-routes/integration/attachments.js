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

/**
 * Note:  This can only be tested if tech preview is *on*  since attachments need tech preview to work
 * correctly
 */

/* eslint-env mocha */

const assert = require('assert')
const fs = require('fs')
const path = require('path')

const Query = require('../../../lib/query')
const Reference = require('../../../lib/generate-routes/models/reference')

const initializeOctaneClient = require('./helper').initializeOctaneClient

describe('[attachments - vanilla]', function () {
  this.timeout(60000)
  this.slow(250)
  const attachmentName = 'attachment.txt'
  const attachmentFile = path.join(__dirname, 'attachment-test.txt')
  const attachmentFileContent = 'This is an attachment test file.'

  let client
  let defectId
  let attachmentID

  before('initialize the Octane client', function (done) {
    const self = this

    initializeOctaneClient(function (err, aClient) {
      if (err) {
        const msg = err.message
        console.log('Aborted - %s',
          typeof msg === 'string' ? msg : JSON.stringify(msg)
        )
        self.skip()
      } else {
        client = aClient

        fs.writeFileSync(attachmentFile, attachmentFileContent)

        // create a defect for attachments
        client.workItemRoots.getAll({ limit: 1 }, function (err, workItemRoots) {
          assert.strictEqual(err, null)
          assert.strictEqual(workItemRoots.length, 1)

          client.severities.getAll({}, function (err, severities) {
            assert.strictEqual(err, null)
            assert(severities.length > 0)

            const q = Query.field('entity').equal('defect')
            client.phases.getAll({ query: q }, function (err, phases) {
              assert.strictEqual(err, null)
              assert(phases.length > 0)
              const defect = {
                name: 'defectforattachment',
                parent: workItemRoots[0],
                severity: severities[0],
                phase: phases[0]
              }
              client.defects.create(defect, function (err, defect) {
                assert.strictEqual(err, null)
                assert(defect.id)
                defectId = defect.id
                createAttachment(done)
              })
            })
          })
        })
      }
    })
  })

  function createAttachment (done) {
    const attachment = {
      name: attachmentName,
      file: attachmentFile,
      owner_work_item: new Reference(defectId, 'work_item')
    }
    client.attachments.create(attachment, function (err, attachment) {
      assert.strictEqual(err, null)
      assert(attachment.id)

      attachmentID = attachment.id
      done()
    })
  }

  after('delete the temporary test file', function (done) {
    if (fs.existsSync(attachmentFile)) {
      fs.unlinkSync(attachmentFile)
    }
    client.defects.delete({ id: defectId }, function () {
      done()
    })
  })

  it('should successfully get all attachments list', function (done) {
    client.attachments.getAll({}, function (err, attachments) {
      assert.strictEqual(err, null)
      assert(attachments.meta.total_count > 0)
      done()
    })
  })

  it('should successfully get the attachment entity data', function (done) {
    client.attachments.get({ id: attachmentID, fields: 'name' }, function (err, attachment) {
      assert.strictEqual(err, null)
      assert.strictEqual(attachment.name, attachmentName)
      done()
    })
  })

  it('should successfully get the attachment binary data', function (done) {
    client.attachments.download({ id: attachmentID, filename: attachmentName }, function (err, data) {
      assert.strictEqual(err, null)
      assert.strictEqual(data.toString(), attachmentFileContent)
      done()
    })
  })

  it('should successfully delete the attachment', function (done) {
    client.attachments.delete({ id: attachmentID }, function (err) {
      assert.strictEqual(err, null)
      done()
    })
  })
})
