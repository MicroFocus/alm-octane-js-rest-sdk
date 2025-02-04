/*
 * Copyright 2020-2025 Open Text.
 *
 * The only warranties for products and services of Open Text and
 * its affiliates and licensors (“Open Text”) are as may be set forth
 * in the express warranty statements accompanying such products and services.
 * Nothing herein should be construed as constituting an additional warranty.
 * Open Text shall not be liable for technical or editorial errors or
 * omissions contained herein. The information contained herein is subject
 * to change without notice.
 *
 * Except as specifically indicated otherwise, this document contains
 * confidential information and a valid license is required for possession,
 * use or copying. If this work is provided to the U.S. Government,
 * consistent with FAR 12.211 and 12.212, Commercial Computer Software,
 * Computer Software Documentation, and Technical Data for Commercial Items are
 * licensed to the U.S. Government under vendor's standard commercial license.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *   http://www.apache.org/licenses/LICENSE-2.0
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

import assert from 'assert';
import Octane from '../../../lib/root/octane';
const convertToRootConfig =
  require('./octaneConfigConverter').convertToRootConfig;

describe('[attachments - generic SDK]', function () {
  // @ts-ignore
  this.timeout(60000);
  // @ts-ignore
  this.slow(250);
  const attachmentName = 'attachment.txt';
  const attachmentFileContent = Buffer.from('This is an attachment test file.');

  let defectId: number;
  let attachmentId: number;
  let octane: Octane;

  before('initializations', async function () {
    const configObject = convertToRootConfig();
    octane = new Octane(configObject);

    const defect = await octane
      .create(Octane.entityTypes.defects, { name: 'testDefect' })
      .execute();
    defectId = parseInt(defect.data[0].id);
    assert(defectId);

    const attachment = await octane
      .uploadAttachment(
        attachmentName,
        attachmentFileContent,
        'owner_work_item',
        { id: defectId, type: 'work_item' }
      )
      .execute();
    attachmentId = parseInt(attachment.data[0].id);
    assert(attachmentId);
  });

  after('cleanup', async function () {
    await octane.delete(Octane.entityTypes.defects).at(defectId).execute();
  });

  it('should successfully get all attachments list', async function () {
    const attachments = await octane
      .get(Octane.entityTypes.attachments)
      .execute();
    assert(attachments.total_count >= 1);
  });

  it('should successfully get the attachment entity data', async function () {
    const attachment = await octane
      .get(Octane.entityTypes.attachments)
      .fields('name')
      .at(attachmentId)
      .execute();
    assert.strictEqual(attachment.name, attachmentName);
  });

  it('should successfully get the attachment data', async function () {
    const attachment = await octane
      .getAttachmentContent()
      .at(attachmentId)
      .execute();
    assert.strictEqual(
      JSON.stringify(attachment),
      JSON.stringify(attachmentFileContent)
    );
  });

  it('should successfully delete the attachment', async function () {
    const attachment = await octane
      .uploadAttachment(
        attachmentName,
        attachmentFileContent,
        'owner_work_item',
        { id: defectId, type: 'work_item' }
      )
      .execute();
    const currentAttachmentId = parseInt(attachment.data[0].id);
    assert(currentAttachmentId);

    await octane
      .delete(Octane.entityTypes.attachments)
      .at(currentAttachmentId)
      .execute();

    await octane
      .get(Octane.entityTypes.attachments)
      .at(currentAttachmentId)
      .execute()
      .catch((err) => assert(err.response.status === 404));
  });
});
