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

import log4js from 'log4js';
import UrlBuilder from './urlBuilder';
import RequestHandler from './requestHandler';

const logger = log4js.getLogger();
logger.level = 'debug';

export interface Params {
  server: string;
  sharedSpace: number;
  workspace: number;
  user: string;
  password: string;
  proxy?: string;
  headers?: Record<string, string | number | boolean>;
}

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
  /**
   *  Types of operations that can be executed through REST API
   */
  static operationTypes: {
    create: string;
    get: string;
    update: string;
    delete: string;
    getAttachmentContent: string;
    uploadAttachment: string;
  } = {
    create: 'create',
    get: 'get',
    update: 'update',
    delete: 'delete',
    getAttachmentContent: 'getAttachmentContent',
    uploadAttachment: 'uploadAttachment',
  };

  /**
   * Entities which can be accessed through REST API
   */
  static entityTypes: {
    applicationModules: string;
    attachments: string;
    automatedRuns: string;
    ciBuilds: string;
    comments: string;
    defects: string;
    epics: string;
    features: string;
    gherkinTests: string;
    listNodes: string;
    manualRuns: string;
    manualTests: string;
    metaphases: string;
    milestones: string;
    phases: string;
    pipelineNodes: string;
    pipelineRuns: string;
    previousRuns: string;
    programs: string;
    releases: string;
    requirementDocuments: string;
    requirementFolders: string;
    requirementRoots: string;
    requirements: string;
    roles: string;
    runSteps: string;
    runs: string;
    scmCommits: string;
    sprints: string;
    stories: string;
    suiteRun: string;
    tasks: string;
    taxonomyCategoryNodes: string;
    taxonomyItemNodes: string;
    taxonomyNodes: string;
    teamSprints: string;
    teams: string;
    testSuiteLinkToAutomatedTests: string;
    testSuiteLinkToGherkinTests: string;
    testSuiteLinkToManualTests: string;
    testSuiteLinkToTests: string;
    testSuites: string;
    tests: string;
    transitions: string;
    userItems: string;
    userTags: string;
    users: string;
    workItemRoots: string;
    workItems: string;
    workspaceRoles: string;
    workspaceUsers: string;
    qualityStories: string;
    fieldsMetadata: string;
    entitiesMetadata: string;
  } = {
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
    qualityStories: 'quality_stories',
    fieldsMetadata: 'metadata/fields',
    entitiesMetadata: 'metadata/entities',
  };
  private _urlBuilder: UrlBuilder;
  private _requestMethod: string | null;
  private _requestHandler: RequestHandler | any;
  private _requestBody: object | null;

  constructor(params: Params) {
    this._urlBuilder = new UrlBuilder(params.sharedSpace, params.workspace);
    this._requestMethod = null;
    this._requestBody = null;

    this._requestHandler = new RequestHandler(params);
  }

  /**
   * When a query returns a large set of data, the results are returned in a series of pages. There is a default limit set for the entities fetched in a page. However, the user can set a custom limit by providing an integer greater that 0.
   *
   * @param limit - An integer which defines how many entities wll be fetched in a page.
   */
  limit(limit: number) {
    this._urlBuilder.limit(limit);
    return this;
  }

  /**
   * @param id - A number which defines which entity will be targeted for the next request.
   */
  at(id: number) {
    this._urlBuilder.at(id);
    return this;
  }

  /**
   * When a query returns a large set of data, the results are returned in a series of pages. There is a default limit set for the entities fetched in a page. Based on that limit, multiple pages are formed. To select the desired range of entities, the offset must be provided as a number which sets the index of the entity which will be fetched first. If the offset is not provided, 0 is used instead.
   *
   * @param offset - A number which defines the index of the element where the page will start.
   */
  offset(offset: number) {
    this._urlBuilder.offset(offset);
    return this;
  }

  /**
   * @param fieldNames - An array with names of fields which is relevant for the order in which the entities will be processed.
   * Adding a '-' at the beginning of any field name will fetch the entities in a descending order (ex: [id, '-name']).
   *
   * Please inspect the field metadata before passing field names to this method.
   */
  orderBy(...fieldNames: string[]) {
    this._urlBuilder.orderBy(fieldNames);
    return this;
  }

  /**
   * @param fieldNames - An array with names of fields relevant for the entity which will be affected by the request. When the request will be fired, the entities affected will contain the listed fields.
   * Please inspect the field metadata before passing field names to this method.
   */
  fields(...fieldNames: string[]) {
    this._urlBuilder.fields(fieldNames);
    return this;
  }

  /**
   * @param query - A string which defines an Octane-specific filter. When the request will be executed, only the entities filtered by the query will be affected or gathered.
   */
  query(query: string) {
    this._urlBuilder.query(query);
    return this;
  }

  /**
   * Builds to the final URL so the request will return the script of the test when it will be fired.
   * This will take effect if the 'tests' entityName is passed for the request. Otherwise, it is simply ignored.
   */
  script() {
    this._urlBuilder.script();
    return this;
  }

  /**
   * This method does not fire the request but builds up to the final request URL and defines the request method.
   * When the get request will be executed, the returned entities will have the type provided by entityName.
   *
   * @param entityName - The name of the Octane entity resource. The value of the entityName should be among Octane.entityTypes.
   */
  get(entityName: string) {
    this._prepareRequest(Octane.operationTypes.get, entityName);
    return this;
  }

  /**
   * This method does not fire the request but builds up to the final URL and defines the request method.
   * When the delete request will be executed, the affected entities will have the type provided by entityName.
   *
   * @param entityName - The name of the Octane entity resource. The value of the entityName should be among Octane.entityTypes.
   */
  delete(entityName: string) {
    this._prepareRequest(Octane.operationTypes.delete, entityName);
    return this;
  }

  /**
   * This method does not fire the request but builds up to the final URL and defines the request method.
   * When the request will be executed, the created entities will have the type provided by entityName and the attributes defined in the body JSON.
   *
   * @param entityName - The name of the Octane entity resource. The value of the entityName should be among Octane.entityTypes.
   * @param body - A JSON which contains the relevant fields names and field values for the entity which will be created. Please inspect the field metadata to create valid objects.
   */
  create(entityName: string, body: object) {
    this._prepareRequest(
      Octane.operationTypes.create,
      entityName,
      this._wrapBody(body)
    );
    return this;
  }

  /**
   * This method does not fire the request but builds up to the final URL and defines the request method.
   * When the request will be executed, the updated entity will have the type provided by entityName and the attributes defined in the body JSON.
   * This method affects a single entity. To target an entity for update the id must be provided and this can be done in the following two ways:
   * - provide the id in the body JSON
   * - provide the at(id) method, available in this class, with the desired id. The at(id) method can be chained to update method.
   *
   * @param entityName - The name of the Octane entity resource. The value of the entityName should be among Octane.entityTypes.
   * @param body - A JSON which contains the relevant fields names and field values for the entity which will be created. Please inspect the field metadata to update the entities correctly.
   */
  update(entityName: string, body: any) {
    if (body.id) {
      this.at(body.id);
    }
    this._prepareRequest(Octane.operationTypes.update, entityName, body);
    return this;
  }

  /**
   * This method does not fire the request but builds up to the final URL and defines the request method.
   * When the request will be executed, the updated entities will have the type provided by entityName and the attributes defined in the body JSON. Every entity in the body JSON must have an existing id to target existing entities in Octane.
   *
   * @param entityName - The name of the Octane entity resource. The value of the entityName should be among Octane.entityTypes.
   * @param body - A JSON which contains the relevant fields names and field values for the entity which will be created. Please inspect the field metadata to update entities correctly.
   */
  updateBulk(entityName: string, body: object) {
    this._prepareRequest(
      Octane.operationTypes.update,
      entityName,
      this._wrapBody(body)
    );
    return this;
  }

  /**
   * This method does not fire the request but builds up to the final request URL and defines the request method.
   * When the get request will be executed it will return the attachment content.
   */
  getAttachmentContent() {
    this._prepareRequest(
      Octane.operationTypes.getAttachmentContent,
      Octane.entityTypes.attachments
    );
    return this;
  }

  /**
   * This method does not fire the request but builds up to the final URL and defines the request method.
   * When the request will be executed, the created attachment will have the name provided by attachmentName, the content defined by attachmentData and it will be under the entity provided by ownerName and ownerReference.
   *
   * @param attachmentName - The name which will be used for attachment creation.
   * @param attachmentData - The content of the attachment which will be uploaded later.
   * @param ownerName - The name of the entity where the attachment will be uploaded, like "owner_release". The possible owner fields can be found in the field metadata of attachments.
   * @param ownerReference - The reference of the entity where the attachment will be uploaded. This can be an id of entity, or a JSON with the type and id of the entity.
   */
  uploadAttachment(
    attachmentName: string,
    attachmentData: any,
    ownerName: string,
    ownerReference: object
  ) {
    this._requestMethod = Octane.operationTypes.uploadAttachment;
    this._requestBody = attachmentData;

    this._urlBuilder.setEntityUrl(Octane.entityTypes.attachments);
    this._urlBuilder.queryParameter('name', attachmentName);
    this._urlBuilder.queryParameter(ownerName, JSON.stringify(ownerReference));

    return this;
  }

  /**
   * Sends an authenticate request to the requestHandler
   */
  async authenticate() {
    const response = await this._requestHandler.authenticate();
    return this._getResponseBody(response);
  }

  /**
   * Sends a sign out request to the requestHandler
   */
  async signOut() {
    const response = await this._requestHandler.signOut();
    return this._getResponseBody(response);
  }

  /**
   *
   * @param customUrl The url to which the request will be sent to. The URL should exclude the server and point to the desired resource.
   * @param operation Must be a value included in the Octane.operationTypes enum
   * @param body The body that should be sent with the request (optional)
   * @param headers Custom headers that should be sent with the request (optional). Should be an object with headers as the key: value pairs.
   * @return - The server's response
   * @throws - The error returned by the server if the request fails or if the operation is not supported.
   */
  async executeCustomRequest(
    customUrl: string,
    operation: string,
    body?: object | string,
    headers?: object
  ) {
    let response;
    let config;

    if (!Object.values(Octane.operationTypes).includes(operation)) {
      throw new Error('Operation is not supported');
    }

    if (headers && typeof headers === 'object') {
      config = { headers };
    }

    if (body) {
      response = await this._requestHandler[operation](customUrl, body, config);
    } else {
      response = await this._requestHandler[operation](customUrl, config);
    }

    return this._getResponseBody(response);
  }

  /**
   * This method is used to execute the request built up so far.
   * It uses the request method set when create/get/update/updateBulk/delete was called. If a body was set in one of the calls, it is used in the request.
   *
   * @return - The server's response.
   * @throws - The error returned by the server if the request fails.
   */
  async execute() {
    if (!this._requestMethod) {
      throw Error('Request method cannot be null!');
    }

    let response;

    if (this._requestBody) {
      response = await this._requestHandler[this._requestMethod](
        this._urlBuilder.build(),
        this._requestBody
      );
      this._requestBody = null;
    } else {
      response = await this._requestHandler[this._requestMethod](
        this._urlBuilder.build()
      );
    }

    return this._getResponseBody(response);
  }

  /**
   *
   * @param response - The axios response
   * @return - The response body
   * @private
   */
  private _getResponseBody(response: { data: any }) {
    return response.data === '' ? undefined : response.data;
  }

  /**
   * Builds up to the final URL setting the entity type provided by entityName, the request type provided by requestMethod and saving the body to be used later in the request.
   *
   * @param requestMethod - The request which will be sent later to Octane.
   * @param entityName - The name of an Octane entity resource.
   * @param body - A JSON which contains field names paired to field values.
   * @private
   */
  private _prepareRequest(
    requestMethod: string,
    entityName: string,
    body: any = undefined
  ) {
    this._urlBuilder.setEntityUrl(entityName);
    this._requestMethod = requestMethod;
    if (body) {
      this._requestBody = body;
    }
  }

  /**
   * Returns a JSON which can be used as request body in requests to Octane.
   *
   * @param body - A JSON which contains field names paired to field values.
   * @returns {{data: [*]}|{data: *}} - A JSON specific to Octane requests.
   * @private
   */
  private _wrapBody(body: any) {
    if (Array.isArray(body)) {
      return { data: body };
    } else {
      return { data: [body] };
    }
  }
}

export default Octane;
