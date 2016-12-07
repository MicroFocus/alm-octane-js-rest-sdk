/*!
 * (c) Copyright 2016 Hewlett Packard Enterprise Development LP
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

'use strict'

var fs = require('fs')
var path = require('path')

var Client = require('../../lib')

exports.initializeOctaneClient = function (callback) {
  var client
  var config

  try {
    config = JSON.parse(
      fs.readFileSync(
        path.join(__dirname, '../../octane.json'),
        'utf8'
      )
    )
  } catch (ex) {
    return callback(ex)
  }

  try {
    client = new Client(config.config)
  } catch (ex) {
    return callback(ex)
  }

  client.authenticate(config.options, function (err) {
    if (err) {
      return callback(err)
    }

    callback(null, client)
  })
}
