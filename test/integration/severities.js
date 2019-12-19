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

const initializeOctaneClient = require('./helper').initializeOctaneClient

describe('[severities]', function () {
  this.timeout(60000)

  let client

  before('initialize the Octane client', function (done) {
    const self = this

    initializeOctaneClient(function (err, aClient) {
      if (err) {
        const msg = err.message
        console.log('Aborted - %s',
          typeof msg === 'string' ? msg : JSON.stringify(msg)
        )
        self.skip()
      } else {
        client = aClient
        done()
      }
    })
  })

  it('should successfully get all severities list', function (done) {
    client.severities.getAll({}, function (err, severities) {
      assert.strictEqual(err, null)
      severities.forEach(function (severity) {
        assert(severity.logical_name.startsWith('list_node.severity.'))
      })
      done()
    })
  })
})
