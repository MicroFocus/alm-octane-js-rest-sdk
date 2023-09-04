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

/* eslint-env mocha */

import assert from 'assert';
import * as utils from '../../lib/generate-routes/utils';

describe('utils', () => {
  describe('toCamelCase', () => {
    it('should transform a string that contains spaces, underscore, or dashes to CamelCase', () => {
      assert.strictEqual(
        utils.toCamelCase('bad-request error'),
        'BadRequestError'
      );
      assert.strictEqual(
        utils.toCamelCase('bad_request error'),
        'BadRequestError'
      );
    });

    it("should transform a string to camelCase if 'lower' is set 'true'", () => {
      assert.strictEqual(utils.toCamelCase('get-all'), 'GetAll');
      assert.strictEqual(utils.toCamelCase('get-all', false), 'GetAll');
      assert.strictEqual(utils.toCamelCase('get-all', true), 'getAll');
    });
  });

  describe('toDisplayName', () => {
    it('should transform a string that underscore to words', () => {
      assert.strictEqual(utils.toDisplayName('ci_job'), 'ci job');
    });

    it("should transform a string to plural words if 'plural' is set 'true'", () => {
      assert.strictEqual(utils.toDisplayName('ci_job'), 'ci job');
      assert.strictEqual(utils.toDisplayName('ci_job', false), 'ci job');
      assert.strictEqual(utils.toDisplayName('ci_job', true), 'ci jobs');
    });
  });

  describe('trim', () => {
    it('should removes whitespace from both ends of a string', () => {
      assert.strictEqual(utils.trim(' hello world\n'), 'hello world');
      assert.strictEqual(utils.trim(''), '');
    });

    it('should keep variable if not a string', () => {
      assert.strictEqual(utils.trim(undefined), undefined);
      assert.strictEqual(utils.trim(null), null);
      assert.strictEqual(utils.trim(5), 5);
    });
  });
});
