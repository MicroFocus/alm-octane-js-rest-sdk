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

/* eslint-env mocha */

import assert from 'assert';
import OctaneVanilla from '../../../lib/generate-routes/octane-routes';

import Query from '../../../lib/query';

const initializeOctaneClient = require('./helper').initializeOctaneClient;

describe('[defects]', function () {
  // @ts-ignore
  this.timeout(60000);
  // @ts-ignore
  this.slow(400);
  const defectName = 'defect test';

  let client: OctaneVanilla | any;
  let defectIDs: string[];
  let workItemRoot: any;
  let allSeverities: any[];
  let allPhases: any[];

  before('initialize the Octane client', function (done) {
    const self = this;
    let msg;

    initializeOctaneClient(function (
      err: { message: string },
      aClient: OctaneVanilla
    ) {
      if (err) {
        msg = err.message;
        console.log(
          'Aborted - %s',
          typeof msg === 'string' ? msg : JSON.stringify(msg)
        );
        self.skip();
      } else {
        client = aClient;

        try {
          createFiveDefects(function () {
            done();
          });
        } catch (error: any) {
          msg = error.message;
          console.log(
            'Aborted - %s',
            typeof msg === 'string' ? msg : JSON.stringify(msg)
          );
          self.skip();
        }
      }
    });
  });

  function createFiveDefects(callback: { (): void; (): void }) {
    client.workItemRoots.getAll(
      { limit: 1 },
      function (err: unknown, workItemRoots: any[]) {
        assert.strictEqual(err, null);
        assert.strictEqual(workItemRoots.length, 1);
        workItemRoot = workItemRoots[0];

        client.severities.getAll(
          {},
          function (err: unknown, severities: any[]) {
            assert.strictEqual(err, null);
            assert(severities.length > 0);
            allSeverities = severities;

            const q = Query.field('entity').equal('defect');
            client.phases.getAll(
              { query: q },
              function (err: unknown, phases: any[]) {
                assert.strictEqual(err, null);
                assert(phases.length > 0);
                allPhases = phases;

                const defects = [];
                for (let loop = 0; loop < 5; ++loop) {
                  defects[loop] = {
                    name: 'defect' + loop,
                    parent: workItemRoot,
                    severity: allSeverities[loop],
                    phase: allPhases[loop],
                  };
                }
                client.defects.createBulk(
                  defects,
                  function (err: any, defects: any) {
                    assert.strictEqual(err, null);
                    assert(defects);

                    defectIDs = defects.data.map(
                      (defect: { id: any }) => defect.id
                    );
                    callback();
                  }
                );
              }
            );
          }
        );
      }
    );
  }

  it('should successfully create and delete a defect', function (done) {
    const defect = {
      name: defectName,
      parent: workItemRoot,
      severity: allSeverities[0],
      phase: allPhases[0],
    };
    client.defects.create(
      defect,
      function (err: unknown, defect: { id: string }) {
        assert.strictEqual(err, null);
        assert(defect.id);
        client.defects.delete({ id: defect.id }, function (err: unknown) {
          assert.strictEqual(err, null);
          done();
        });
      }
    );
    // @ts-ignore
  }).slow(800);

  it('should successfully get a defect', function (done) {
    client.defects.get(
      { id: defectIDs[0], fields: 'name' },
      function (err: unknown, defect: { name: string }) {
        assert.strictEqual(err, null);
        assert(defect);
        assert(defect.name);
        done();
      }
    );
  });

  it('should successfully update a defect', function (done) {
    const name = 'defect test updated' + Math.floor(Math.random() * 100 + 1);
    client.defects.update(
      { id: defectIDs[0], name: name },
      function (err: unknown, defect: unknown) {
        assert.strictEqual(err, null);
        assert(defect);

        client.defects.get(
          { id: defectIDs[0], fields: 'name' },
          function (err: unknown, defect: { name: unknown }) {
            assert.strictEqual(err, null);
            assert.strictEqual(defect.name, name);
            done();
          }
        );
      }
    );
  });

  it('should successfully update two defects', function (done) {
    const name1 = 'defect1 test updated' + Math.floor(Math.random() * 100 + 1);
    const name2 = 'defect2 test updated' + Math.floor(Math.random() * 100 + 1);
    client.defects.updateBulk(
      [
        { id: defectIDs[0], name: name1 },
        {
          id: defectIDs[1],
          name: name2,
        },
      ],
      function (err: unknown, defect: unknown) {
        assert.strictEqual(err, null);
        assert(defect);

        client.defects.get(
          { id: defectIDs[0], fields: 'name' },
          function (err: unknown, defect: { name: unknown }) {
            assert.strictEqual(err, null);
            assert.strictEqual(defect.name, name1);

            client.defects.get(
              { id: defectIDs[1], fields: 'name' },
              function (err: unknown, defect: { name: unknown }) {
                assert.strictEqual(err, null);
                assert.strictEqual(defect.name, name2);
                done();
              }
            );
          }
        );
      }
    );
  });

  it('should successfully get all defects list', function (done) {
    client.defects.getAll(
      {},
      function (
        err: unknown,
        defects: { meta: { total_count: number }; length: number }
      ) {
        assert.strictEqual(err, null);
        assert(defects.meta.total_count > 0);
        assert(defects.length > 0);
        done();
      }
    );
  });

  it('should successfully get defects list with limit', function (done) {
    client.defects.getAll(
      { limit: 3 },
      function (
        err: unknown,
        defects: { meta: { total_count: number }; length: number }
      ) {
        assert.strictEqual(err, null);
        assert(defects.meta.total_count > 0);
        assert(defects.length === 3);
        done();
      }
    );
  });

  it('should successfully get defects list with filter', function (done) {
    const q = Query.field('severity').equal(
      Query.field('id').equal('severity')
    );
    client.defects.getAll(
      { query: q },
      function (err: unknown, defects: any[]) {
        assert.strictEqual(err, null);
        defects.forEach(function (defect: { severity: { name: unknown } }) {
          assert.strictEqual(defect.severity.name, 'Low');
        });
        done();
      }
    );
  });

  it('should successfully get defects list with order', function (done) {
    client.defects.getAll(
      { order_by: 'id' },
      function (err: unknown, defects: any[]) {
        assert.strictEqual(err, null);
        for (let i = 1, l = defects.length; i < l; i++) {
          assert(parseInt(defects[i - 1].id) < parseInt(defects[i].id));
        }
        done();
      }
    );
  });

  after('Delete all created defects', function (done) {
    client.defects.getAll(
      {
        fields: 'id',
        query: Query.field('id').inComparison(defectIDs),
      },
      function (err: unknown, defects: any) {
        assert.strictEqual(err, null);
        const promises = [];
        for (const defect of defects) {
          const id = defect.id;
          promises.push(
            new Promise<void>(function (resolve) {
              client.defects.delete({ id: id }, function () {
                resolve();
              });
            })
          );
        }
        Promise.all(promises).then(function () {
          done();
        });
      }
    );
  });
});
