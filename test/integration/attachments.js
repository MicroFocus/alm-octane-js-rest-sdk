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

/**
 * Note:  This can only be tested if tech preview is *on*  since attachments need tech preview to work
 * correctly
 */

/* eslint-env mocha */

'use strict'

var Query = require('../../lib/query')
var Reference = require('../../lib/models/reference')
var assert = require('assert')

var fs = require('fs')
var path = require('path')

var initializeOctaneClient = require('./helper').initializeOctaneClient

describe('[attachments]', function () {
  this.timeout(60000)

  var client
  var defectId
  var attachmentID
  var attachmentName = 'attachment.txt'
  var attachmentFile = path.join(__dirname, 'attachment-test.txt')
  var attachmentFileContent = 'This is an attachment test file.'

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

        fs.writeFileSync(attachmentFile, attachmentFileContent)

        // create a defect for attachments
        client.workItemRoots.getAll({ limit: 1 }, function (err, workItemRoots) {
          assert.strictEqual(err, null)
          assert.strictEqual(workItemRoots.length, 1)

          client.severities.getAll({}, function (err, severities) {
            assert.strictEqual(err, null)
            assert(severities.length > 0)

            var q = Query.field('entity').equal('defect')
            client.phases.getAll({ query: q }, function (err, phases) {
              assert.strictEqual(err, null)
              assert(phases.length > 0)
              var defect = {
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
    var attachment = {
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
    client.attachments.get({ id: attachmentID }, function (err, attachment) {
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
