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

/**
 * Note:  This can only be tested if tech preview is *on*  since attachments need tech preview to work
 * correctly
 */

/* eslint-env mocha */

const assert = require('assert')
const Octane = require('../../../lib/root/octane')
const convertToRootConfig = require('./octaneConfigConverter').convertToRootConfig

describe('[attachments]', function () {
  this.timeout(60000)
  this.slow(250)
  const attachmentName = 'attachment.txt'
  const attachmentFileContent = 'This is an attachment test file.'

  let defectId
  let attachmentId
  let octane

  before('initializations', async function () {
    const configObject = convertToRootConfig()
    octane = new Octane(configObject)

    let defect = await octane.create(Octane.entityTypes.defects, { name: 'testDefect' }).execute()
    defectId = parseInt(defect.data[0].id)
    assert(defectId)

    let attachment = await octane.uploadAttachment(attachmentName, attachmentFileContent, 'owner_work_item', defectId).execute()
    attachmentId = parseInt(attachment.data[0].id)
    assert(attachmentId)
  })

  after('cleanup', async function () {
    await octane.delete(Octane.entityTypes.defects).at(defectId).execute()
  })

  it('should successfully get all attachments list', async function () {
    let attachments = await octane.get(Octane.entityTypes.attachments).execute()
    assert(attachments.total_count >= 1)
  })

  it('should successfully get the attachment entity data', async function () {
    let attachment = await octane.get(Octane.entityTypes.attachments).at(attachmentId).execute()
    assert.strictEqual(attachment.name, attachmentName)
  })

  it('should successfully get the attachment data', async function () {
    let attachment = await octane.getAttachmentContent(Octane.entityTypes.attachments).at(attachmentId).execute()
    assert.strictEqual(attachment, attachmentFileContent)
  })

  it('should successfully delete the attachment', async function () {
    let attachment = await octane.uploadAttachment(attachmentName, attachmentFileContent, 'owner_work_item', defectId).execute()
    let currentAttachmentId = parseInt(attachment.data[0].id)
    assert(currentAttachmentId)

    await octane.delete(Octane.entityTypes.attachments).at(currentAttachmentId).execute()

    await octane.get(Octane.entityTypes.attachments).at(currentAttachmentId).execute().catch(err => assert(err.statusCode === 404))
  })
})