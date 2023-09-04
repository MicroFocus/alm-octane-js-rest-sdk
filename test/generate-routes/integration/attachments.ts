/*
 * Copyright 2020-2023 Open Text.
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
import fs from 'fs';
import path from 'path';

import Query from '../../../lib/query';
import Reference from '../../../lib/generate-routes/models/reference';
import OctaneVanilla from '../../../lib/generate-routes/octane-routes';

const initializeOctaneClient = require('./helper').initializeOctaneClient;

describe('[attachments - vanilla]', function () {
  // @ts-ignore
  this.timeout(60000);
  // @ts-ignore
  this.slow(250);
  const attachmentName = 'attachment.txt';
  const attachmentFile = path.join(__dirname, 'attachment-test.txt');
  const attachmentFileContent = 'This is an attachment test file.';

  let client: OctaneVanilla | any;
  let defectId: string;
  let attachmentID: string;

  before('initialize the Octane client', function (done) {
    const self = this;

    initializeOctaneClient(function (
      err: { message: any },
      aClient: OctaneVanilla
    ) {
      if (err) {
        const msg = err.message;
        console.log(
          'Aborted - %s',
          typeof msg === 'string' ? msg : JSON.stringify(msg)
        );
        self.skip();
      } else {
        client = aClient;

        fs.writeFileSync(attachmentFile, attachmentFileContent);

        // create a defect for attachments
        client.workItemRoots.getAll(
          { limit: 1 },
          function (err: unknown, workItemRoots: string | any[]) {
            assert.strictEqual(err, null);
            assert.strictEqual(workItemRoots.length, 1);

            client.severities.getAll(
              {},
              function (err: unknown, severities: string | any[]) {
                assert.strictEqual(err, null);
                assert(severities.length > 0);

                const q = Query.field('entity').equal('defect');
                client.phases.getAll(
                  { query: q },
                  function (err: unknown, phases: string | any[]) {
                    assert.strictEqual(err, null);
                    assert(phases.length > 0);
                    const defect = {
                      name: 'defectforattachment',
                      parent: workItemRoots[0],
                      severity: severities[0],
                      phase: phases[0],
                    };
                    client.defects.create(
                      defect,
                      function (err: unknown, defect: { id: string }) {
                        assert.strictEqual(err, null);
                        assert(defect.id);
                        defectId = defect.id;
                        createAttachment(done);
                      }
                    );
                  }
                );
              }
            );
          }
        );
      }
    });
  });

  function createAttachment(done: { (err?: any): void; (): void }) {
    const attachment = {
      name: attachmentName,
      file: attachmentFile,
      owner_work_item: new Reference(defectId, 'work_item'),
    };
    client.attachments.create(
      attachment,
      function (err: unknown, attachment: { id: string }) {
        assert.strictEqual(err, null);
        assert(attachment.id);

        attachmentID = attachment.id;
        done();
      }
    );
  }

  after('delete the temporary test file', function (done) {
    if (fs.existsSync(attachmentFile)) {
      fs.unlinkSync(attachmentFile);
    }
    client.defects.delete({ id: defectId }, function () {
      done();
    });
  });

  it('should successfully get all attachments list', function (done) {
    client.attachments.getAll(
      {},
      function (err: unknown, attachments: { meta: { total_count: number } }) {
        assert.strictEqual(err, null);
        assert(attachments.meta.total_count > 0);
        done();
      }
    );
  });

  it('should successfully get the attachment entity data', function (done) {
    client.attachments.get(
      { id: attachmentID, fields: 'name' },
      function (err: unknown, attachment: { name: unknown }) {
        assert.strictEqual(err, null);
        assert.strictEqual(attachment.name, attachmentName);
        done();
      }
    );
  });

  it('should successfully get the attachment binary data', function (done) {
    client.attachments.download(
      { id: attachmentID, filename: attachmentName },
      function (err: unknown, data: { toString: () => unknown }) {
        assert.strictEqual(err, null);
        assert.strictEqual(data.toString(), attachmentFileContent);
        done();
      }
    );
  });

  it('should successfully delete the attachment', function (done) {
    client.attachments.delete({ id: attachmentID }, function (err: unknown) {
      assert.strictEqual(err, null);
      done();
    });
  });
});
