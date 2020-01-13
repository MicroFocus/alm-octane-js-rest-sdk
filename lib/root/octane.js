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

const log4js = require('log4js'),
  UrlBuilder = require('./urlBuilder'),
  RequestHandler = require('./requestHandler')

const logger = log4js.getLogger()
logger.level = 'debug'

class Octane {
  constructor (params) {
    this._urlBuilder = new UrlBuilder(params.server, params.sharedSpace, params.workspace)
    this._requestMethod = null

    this.requestHandler = new RequestHandler(params)
  }

  limit (limit) {
    this._urlBuilder.limit(limit)
    return this
  }

  at (id) {
    this._urlBuilder.at(id)
    return this
  }

  offset (offset) {
    this._urlBuilder.offset(offset)
    return this
  }

  orderBy (...fieldNames) {
    this._urlBuilder.orderBy(fieldNames)
    return this
  }

  fields (...fieldNames) {
    this._urlBuilder.fields(fieldNames)
    return this
  }

  get (entityName) {
    this._urlBuilder.getEntityUrl(entityName)
    this._requestMethod = 'get'
    return this
  }

  delete (entityName) {
    this._urlBuilder.getEntityUrl(entityName)
    this._requestMethod = 'delete'
    return this
  }

  create (entityName, body) {
    this._urlBuilder.getEntityUrl(entityName)
    this._requestMethod = 'create'
    this.requestBody = body
    return this
  }

  update (entityName, body) {
    this._urlBuilder.getEntityUrl(entityName)
    this._requestMethod = 'update'
    this.requestBody = body
    return this
  }

  async signOut () {
    await this.requestHandler.signOut()
  }

  query (query) {
    this._urlBuilder.query(query)
    return this
  }

  async execute () {
    if (this.requestBody) {
      let response = this.requestHandler[this._requestMethod](this._urlBuilder.build(), this.requestBody)
      this.requestBody = null
      return response
    } else {
      return this.requestHandler[this._requestMethod](this._urlBuilder.build())
    }
  }
}

module.exports = Octane

global.octaneEntityTypes = {
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
  productAreas: 'product_areas',
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
  workItems: 'workItems',
  qualityStories: 'quality_stories'
}
