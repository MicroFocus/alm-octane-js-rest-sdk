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

/* eslint-env mocha */

const assert = require('assert')
const HttpError = require('../lib/error')

describe('error', function () {
  describe('HttpError', function () {
    let e

    beforeEach(function () {
      e = new HttpError('error message', 500, null)
    })

    it('should create an instance which inherits Error', () => {
      assert(e instanceof Error)
    })

    describe('#toString', () => {
      it('should return the message', () => {
        assert.strictEqual(String(e), 'error message')
      })
    })

    describe('#toJSON', () => {
      it('should return an object', () => {
        assert.deepStrictEqual(
          e.toJSON(),
          {
            code: 500,
            status: 'Internal Server Error',
            message: 'error message'
          }
        )
      })
    })
  })

  describe('BadRequest', () => {
    it('should create an instance which inherits HttpError', () => {
      const err = new HttpError.BadRequest()
      assert(err instanceof HttpError)
    })

    it('should create an instance with default message', () => {
      const err = new HttpError.BadRequest()
      assert.strictEqual(String(err), '400:Bad Request')
      assert.deepStrictEqual(
        err.toJSON(),
        {
          code: '400',
          status: 'Bad Request',
          message: '400:Bad Request'
        }
      )
    })

    it('should create an instance with specified message', () => {
      const err = new HttpError.BadRequest('Invalid parameter')
      assert.strictEqual(String(err), 'Invalid parameter')
      assert.deepStrictEqual(
        err.toJSON(),
        {
          code: '400',
          status: 'Bad Request',
          message: 'Invalid parameter'
        }
      )
    })
  })
})
