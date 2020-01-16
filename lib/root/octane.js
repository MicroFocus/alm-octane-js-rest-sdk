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

const log4js = require('log4js')
const UrlBuilder = require('./urlBuilder')
const RequestHandler = require('./requestHandler')

const logger = log4js.getLogger()
logger.level = 'debug'

/**
 * @class
 *
 * @param {Object} params - configurations to access Octane REST API
 * @param {String} params.server - server of Octane REST API URL (ex: https://myOctane:8080)
 * @param {Number} params.sharedSpace - Octane shared space id
 * @param {Number} params.workspace - Octane workspace id
 * @param {Number} params.user - Octane user
 * @param {Number} params.password - Octane password
 * @param {String} [params.proxy] - if set, using proxy to connect to Octane
 * @param {Object} [params.headers] - JSON containing headers which will be used for all the requests
 */
class Octane {
  constructor (params) {
    this._urlBuilder = new UrlBuilder(params.server, params.sharedSpace, params.workspace)
    this._requestMethod = null

    this._requestHandler = new RequestHandler(params)
  }

  /**
   * @param {Number} limit - Adds the limit query parameter to the octane request URL.
   */
  limit (limit) {
    this._urlBuilder.limit(limit)
    return this
  }

  /**
   * @param {number} id - The request URL will contain the entity id:
   * ../{entity_api_name}/{entity_id}/...
   */
  at (id) {
    this._urlBuilder.at(id)
    return this
  }

  /**
   * @param {Number} offset - Adds the offset query parameter to the octane request URL.
   */
  offset (offset) {
    this._urlBuilder.offset(offset)
    return this
  }

  /**
   * @param {Object} fieldNames - The fields will be added to the request URL in the 'order_by' parameter.
   * The order can be det from ascending to descending by adding a '-' at the beginning of any field name.
   *
   * ex: [id, '-name']
   */
  orderBy (...fieldNames) {
    this._urlBuilder.orderBy(fieldNames)
    return this
  }

  /**
   * @param {Object} fieldNames - The fields will be added to the request URL in the 'fields' parameter.
   */
  fields (...fieldNames) {
    this._urlBuilder.fields(fieldNames)
    return this
  }

  /**
   * @param {String} query - The fields will be added to the request URL in the 'query' parameter.
   */
  query (query) {
    this._urlBuilder.query(query)
    return this
  }

  /**
   * Will add a /script at the end of the request URL only if the entity name for the request is 'tests'
   */
  script () {
    this._urlBuilder.script()
    return this
  }

  /**
   * @param entityName - The name of the entity resource
   */
  get (entityName) {
    this._prepareRequest('get', entityName)
    return this
  }

  /**
   * @param entityName - The name of the entity resource
   * Passes the entity name to the UrlBuilder
   */
  delete (entityName) {
    this._prepareRequest('delete', entityName)
    return this
  }

  /**
   * @param entityName - The name of the entity resource
   * Passes the entity name to the UrlBuilder
   */
  create (entityName, body) {
    this._prepareRequest('create', entityName, this._wrapBody(body))
    return this
  }

  /**
   * Update for a single entity
   *
   * @param entityName - The name of the entity resource
   * Passes the entity name to the UrlBuilder
   */
  update (entityName, body) {
    if (body.id) {
      this.at(body.id)
    }
    this._prepareRequest('update', entityName, body)
    return this
  }

  /**
   * Can be used to update multiple entities
   *
   * @param entityName - The name of the entity resource
   * Passes the entity name to the UrlBuilder
   */
  updateBulk (entityName, body) {
    this._prepareRequest('update', entityName, this._wrapBody(body))
    return this
  }

  /**
   * Sends a sign out request for the requestHandler
   */
  async signOut () {
    this._requestHandler.signOut()
  }

  /**
   * @return - The response of the request which can be an error or a valid response from the server
   */
  async execute () {
    if (this._requestBody) {
      const response = this._requestHandler[this._requestMethod](this._urlBuilder.build(), this._requestBody)
      this._requestBody = null
      return response
    } else {
      return this._requestHandler[this._requestMethod](this._urlBuilder.build())
    }
  }

  _prepareRequest (requestMethod, entityName, body) {
    this._urlBuilder.setEntityUrl(entityName)
    this._requestMethod = 'create'
    if (body) {
      this._requestBody = body
    }
  }

  _wrapBody (body) {
    if (body.isArray()) {
      return { data: body }
    } else {
      return { data: [body] }
    }
  }
}

module.exports = Octane

/**
 * Entities which can be accessed through REST API
 */
Octane.entityTypes = {
  applicationModules: 'application_modules',
  attachments: 'attachments',
  automatedRuns: 'automated_runs',
  ciBuilds: 'ci_builds',
  comments: 'comments',
  defects: 'defects',
  epics: 'epics',
  features: 'features',
  gherkinTests: 'gherkin_tests',
  listNodes: 'list_nodes',
  manualRuns: 'manual_runs',
  manualTests: 'manualTests',
  metaphases: 'metaphases',
  milestones: 'milestones',
  phases: 'phases',
  pipelineNodes: 'pipeline_nodes',
  pipelineRuns: 'pipeline_runs',
  previousRuns: 'previous_runs',
  programs: 'programs',
  releases: 'releases',
  requirementDocuments: 'requirement_documents',
  requirementFolders: 'requirement_folders',
  requirementRoots: 'requirement_roots',
  requirements: 'requirements',
  roles: 'roles',
  runSteps: 'run_steps',
  runs: 'runs',
  scmCommits: 'scm_commits',
  sprints: 'sprints',
  stories: 'stories',
  suiteRun: 'suite_run',
  tasks: 'tasks',
  taxonomyCategoryNodes: 'taxonomy_category_nodes',
  taxonomyItemNodes: 'taxonomy_item_nodes',
  taxonomyNodes: 'taxonomy_nodes',
  teamSprints: 'team_sprints',
  teams: 'teams',
  testSuiteLinkToAutomatedTests: 'test_suite_link_to_automated_tests',
  testSuiteLinkToGherkinTests: 'test_suite_link_to_gherkin_tests',
  testSuiteLinkToManualTests: 'test_suite_link_to_manual_tests',
  testSuiteLinkToTests: 'test_suite_link_to_tests',
  testSuites: 'test_suites',
  tests: 'tests',
  transitions: 'transitions',
  userItems: 'user_items',
  userTags: 'user_tags',
  users: 'users',
  workItemRoots: 'work_item_roots',
  workItems: 'work_items',
  workspaceRoles: 'workspace_roles',
  workspaceUsers: 'workspace_users',
  qualityStories: 'quality_stories'
}
