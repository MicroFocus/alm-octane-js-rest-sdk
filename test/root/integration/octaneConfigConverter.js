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

const fs = require('fs')
const path = require('path')

exports.convertToRootConfig = function () {
  const generateRoutesConfig = JSON.parse(fs.readFileSync(path.join(__dirname, '../../../octane.json'), 'utf8'))
  const rootConfig = {}
  rootConfig.server = generateRoutesConfig.config.protocol +
    '://' +
    generateRoutesConfig.config.host
  if (generateRoutesConfig.config.port) {
    rootConfig.server += ':' + generateRoutesConfig.config.port
  }
  if (generateRoutesConfig.options.username && generateRoutesConfig.options.password) {
    rootConfig.user = generateRoutesConfig.options.username
    rootConfig.password = generateRoutesConfig.options.password
  } else {
    rootConfig.user = generateRoutesConfig.options.client_id
    rootConfig.password = generateRoutesConfig.options.client_secret
  }
  if (generateRoutesConfig.config.headers) {
    rootConfig.headers = generateRoutesConfig.config.headers
  }
  if (generateRoutesConfig.config.tech_preview_API) {
    rootConfig.headers = { ...rootConfig.headers, HPECLIENTTYPE: 'HPE_REST_API_TECH_PREVIEW' }
  }
  rootConfig.sharedSpace = generateRoutesConfig.config.shared_space_id
  rootConfig.workspace = generateRoutesConfig.config.workspace_id
  rootConfig.proxy = generateRoutesConfig.config.proxy

  return rootConfig
}
