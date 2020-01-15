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

/* eslint-env mocha */

const assert = require('assert')
const utils = require('../../lib/generate-routes/utils')

describe('utils', () => {
  describe('toCamelCase', () => {
    it('should transform a string that contains spaces, underscore, or dashes to CamelCase', () => {
      assert.strictEqual(utils.toCamelCase('bad-request error'), 'BadRequestError')
      assert.strictEqual(utils.toCamelCase('bad_request error'), 'BadRequestError')
    })

    it('should transform a string to camelCase if \'lower\' is set \'true\'', () => {
      assert.strictEqual(utils.toCamelCase('get-all'), 'GetAll')
      assert.strictEqual(utils.toCamelCase('get-all', false), 'GetAll')
      assert.strictEqual(utils.toCamelCase('get-all', true), 'getAll')
    })
  })

  describe('toDisplayName', () => {
    it('should transform a string that underscore to words', () => {
      assert.strictEqual(utils.toDisplayName('ci_job'), 'ci job')
    })

    it('should transform a string to plural words if \'plural\' is set \'true\'', () => {
      assert.strictEqual(utils.toDisplayName('ci_job'), 'ci job')
      assert.strictEqual(utils.toDisplayName('ci_job', false), 'ci job')
      assert.strictEqual(utils.toDisplayName('ci_job', true), 'ci jobs')
    })
  })

  describe('trim', () => {
    it('should removes whitespace from both ends of a string', () => {
      assert.strictEqual(utils.trim(' hello world\n'), 'hello world')
      assert.strictEqual(utils.trim(''), '')
    })

    it('should keep variable if not a string', () => {
      assert.strictEqual(utils.trim(undefined), undefined)
      assert.strictEqual(utils.trim(null), null)
      assert.strictEqual(utils.trim(5), 5)
    })
  })
})
