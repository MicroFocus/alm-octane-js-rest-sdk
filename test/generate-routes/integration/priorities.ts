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

const initializeOctaneClient = require('./helper').initializeOctaneClient;

describe('[priorities]', function () {
  // @ts-ignore
  this.timeout(60000);
  // @ts-ignore
  this.slow(200);

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

  it('should successfully get all priorities list', function (done) {
    client.priorities.getAll({}, function (err: unknown, priorities: any[]) {
      assert.strictEqual(err, null);
      priorities.forEach(function (priority) {
        assert(priority.logical_name.startsWith('list_node.priority.'));
      });
      done();
    });
  });
});
