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

import fs from 'fs';
import path from 'path';
import OctaneVanilla from '../../../lib/generate-routes/octane-routes';

import Client from '../../../lib/generate-routes/octane-routes';

exports.initializeOctaneClient = function (callback: Function) {
  let client: OctaneVanilla;
  let config: any;

  try {
    config = JSON.parse(
      fs.readFileSync(path.join(__dirname, '../../../octane.json'), 'utf8')
    );
  } catch (ex) {
    return callback(ex);
  }

  try {
    client = new Client(config.config);
  } catch (ex) {
    return callback(ex);
  }

  client.authenticate(config.options, function (err: unknown) {
    if (err) {
      return callback(err);
    }

    callback(null, client);
  });
};
