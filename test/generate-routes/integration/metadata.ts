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

import assert from 'assert';
import OctaneVanilla from '../../../lib/generate-routes/octane-routes';

import Query from '../../../lib/query';

const initializeOctaneClient = require('./helper').initializeOctaneClient;

describe('[metadata/entities]', function () {
  // @ts-ignore
  this.timeout(60000);
  // @ts-ignore
  this.slow(550);

  let client: OctaneVanilla | any;

  before('initialize the Octane client', function (done) {
    const self = this;

    initializeOctaneClient(function (
      err: { message: string },
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
        done();
      }
    });
  });

  it('should successfully get all entities list', function (done) {
    client.metadata.getEntities({}, function (err: unknown, entities: any) {
      assert.strictEqual(err, null);
      assert(entities.meta.total_count > 0);
      done();
    });
  });

  it('should successfully get entities list with filter', function (done) {
    const q = Query.field('name').equal('defect');
    client.metadata.getEntities(
      { query: q },
      function (err: unknown, entities: any) {
        assert.strictEqual(err, null);
        assert.strictEqual(entities.meta.total_count, 1);
        done();
      }
    );
  });
});

describe('[metadata/fields]', function () {
  // @ts-ignore
  this.timeout(60000);
  // @ts-ignore
  this.slow(1000);

  let client: OctaneVanilla | any;

  before('initialize the Octane client', function (done) {
    const self = this;

    initializeOctaneClient(function (
      err: { message: string },
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
        done();
      }
    });
  });

  it('should successfully get all fields list', function (done) {
    client.metadata.getFields({}, function (err: unknown, fields: any) {
      assert.strictEqual(err, null);
      assert(fields.meta.total_count > 0);
      done();
    });
  });

  it('should successfully get fields list with filter', function (done) {
    const q = Query.field('entity_name').equal('defect');
    client.metadata.getFields(
      { query: q },
      function (err: unknown, fields: any) {
        assert.strictEqual(err, null);
        fields.forEach(function (field: { entity_name: string }) {
          assert.strictEqual(field.entity_name, 'defect');
        });
        done();
      }
    );
  });
});
