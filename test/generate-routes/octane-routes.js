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

const assert = require('assert')
const Octane = require('../../lib/generate-routes/octane-routes')

describe('Otcane', () => {
  it('should create an instance with the required configurations', () => {
    const client = new Octane({
      host: 'octane.microfocus.com',
      shared_space_id: 1001,
      workspace_id: 1002
    })

    assert.notStrictEqual(client, null)
  })

  it('should throw exception when the required configurations are not provided', () => {
    assert.throws(() => {
      const client = new Octane({ host: 'octane.microfocus.com' })
      assert.notStrictEqual(client, null)
    }, Error)
  })
})
