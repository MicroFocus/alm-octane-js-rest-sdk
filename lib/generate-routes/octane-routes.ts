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

/** @module octane */

import fs from 'fs';

import path from 'path';
import request from 'request';

import Query from '../query';
import Reference from './models/reference';
import MultiReference from './models/multi-reference';

const debug = require('debug')('octane');
import * as utils from './utils';

const Error = require('http-errors');

const META_ROUTES_FILE = '../../routes/meta.json';
const DEFAULT_ROUTES_FILE = '../../routes/default.json';

interface Config {
  protocol?: 'http' | 'https';
  host: string;
  port?: number;
  pathPrefix?: string;
  shared_space_id: number;
  workspace_id: number;
  proxy?: string;
  routesConfig?: string | { defines?: any };
  octaneCredentials?: any;
  headers?: Record<string, string | number | boolean>;
  tech_preview_API?: boolean;
}

/**
 * @class
 *
 * @param {Object} config - configurations to access Octane REST API
 * @param {('http'|'https')} [config.protocol] - protocol of Octane REST API URL
 * @param {String} config.host - server of Octane REST API URL
 * @param {Number} [config.port] - port of Octane REST API URL
 * @param {String} [config.pathPrefix] - path prefix of Octane REST API URL
 * @param {Number} config.shared_space_id - Octane shared space id
 * @param {Number} config.workspace_id - Octane workspace id
 * @param {String} [config.proxy] - if set, using proxy to connect to Octane
 * @param {String|Object} [config.routesConfig] - if set, using the specified path as API definition, or use the JSON object directly
 */
class OctaneVanilla {
  private config: Config;
  private routes: { defines?: any } | string;
  private octaneCredentials: any;
  private constants: any;
  private baseUrl: string;
  private baseApiUrl: string;
  private requestor: request.RequestAPI<
    request.Request,
    request.CoreOptions,
    request.RequiredUriUrl
  >;
  private params: any;
  constructor(config: Config) {
    config = config || {};
    if (!config.host || !config.shared_space_id || !config.workspace_id) {
      throw new Error(
        'Octane host / shared space id / workspace id are required'
      );
    }

    this.config = config;

    if (config.routesConfig && typeof config.routesConfig === 'object') {
      this.routes = config.routesConfig;
    } else if (
      config.routesConfig &&
      path.isAbsolute(config.routesConfig) &&
      fs.existsSync(config.routesConfig)
    ) {
      this.routes = JSON.parse(fs.readFileSync(config.routesConfig).toString());
    } else if (fs.existsSync(path.join(__dirname, DEFAULT_ROUTES_FILE))) {
      this.routes = JSON.parse(
        fs.readFileSync(path.join(__dirname, DEFAULT_ROUTES_FILE), 'utf8')
      );
    } else {
      this.routes = JSON.parse(
        fs.readFileSync(path.join(__dirname, META_ROUTES_FILE), 'utf8')
      );
    }

    if (this.config.octaneCredentials) {
      this.octaneCredentials = this.config.octaneCredentials;
      delete this.config.octaneCredentials;
    }

    this.setupRoutes();

    const host = this.config.host || this.constants.host;
    const protocol = this.config.protocol || this.constants.protocol || 'http';
    const port = this.config.port || (protocol === 'https' ? 443 : 80);
    const pathPrefix = this.config.pathPrefix
      ? '/' + this.config.pathPrefix.replace(/(^[/]+|[/]+$)/g, '')
      : '';

    this.baseUrl = protocol + '://' + host + ':' + port + pathPrefix;
    this.baseApiUrl =
      this.baseUrl +
      '/api/shared_spaces/' +
      this.config.shared_space_id +
      '/workspaces/' +
      this.config.workspace_id;
    const opt: {
      jar: boolean;
      json: boolean;
      baseUrl: string;
      headers?: Record<string, string | number | boolean>;
      proxy?: string;
    } = {
      jar: true,
      json: true,
      baseUrl: this.baseApiUrl,
    };
    if (this.config.headers) {
      opt.headers = this.config.headers;
    }
    if (this.config.tech_preview_API) {
      // legacy tech preview client type
      opt.headers = { ...opt.headers, 'ALM-OCTANE-TECH-PREVIEW': true };
    }

    if (this.config.proxy) {
      opt.proxy = this.config.proxy;
    }

    debug('with octaneCredentials %j', opt);

    this.requestor = request.defaults(opt);
  }

  /**
   * Login to Octane.
   * @param {OctaneCredentials|OctaneVanilla~authenticateCallback} [octaneCredentials] - Credentials needed to access octane.
   *        If no credentials are given, the last given credentials will be used.
   *        If no credentials were ever given, the callback will be called with an error.
   * @param {OctaneVanilla~authenticateCallback} callback - Callback that handles error and authenticated operations
   */
  authenticate(
    octaneCredentials: ((err: any) => void) | undefined,
    callback?: Function
  ) {
    if (callback === undefined && typeof octaneCredentials === 'function') {
      callback = octaneCredentials;
      octaneCredentials = undefined;
    }
    if (octaneCredentials) {
      this.octaneCredentials = octaneCredentials;
    } else {
      if (!this.octaneCredentials) {
        const error = new Error('No authentication credentials given');
        return callback!(error);
      }
    }
    debug('authenticate %j', octaneCredentials);

    const body: {
      user?: string;
      password?: string;
      client_id?: string;
      client_secret?: string;
    } = {};
    if (this.octaneCredentials.username && this.octaneCredentials.password) {
      body.user = this.octaneCredentials.username;
      body.password = this.octaneCredentials.password;
    } else if (
      this.octaneCredentials.client_id &&
      this.octaneCredentials.client_secret
    ) {
      body.client_id = this.octaneCredentials.client_id;
      body.client_secret = this.octaneCredentials.client_secret;
    }

    this.requestor.post(
      {
        url: this.baseUrl + '/authentication/sign_in',
        body: body,
        baseUrl: '', // set base url to nothing such that the url is not interpreted as an uri
      },
      (err, response, body) => {
        if (err) {
          debug('authentication failed %j', err);
          return callback!(err);
        }

        if (response.statusCode >= 400) {
          err = new Error.HttpError(
            response.statusCode,
            body,
            response.headers
          );
          debug('authentication failed %j', err);
          return callback!(err);
        }

        callback!();
      }
    );
  }

  /**
   * setupRoute() is invoked by the constructor, takes the contents of the
   * JSON document that contains the definitions of all the available API
   * routes and iterate over them.
   * It first recurses through each definition block until it reaches an API
   * endpoint. It knows that an endpoint is found when the 'url' and 'param'
   * definitions are found as a direct member of a definition block.
   * A method is attached to the Octane instance and becomes available for use.
   * Inside this method, the parameter validation and typecasting is done,
   * according to the definition of the parameters in the 'params' block, upon
   * invocation.
   */
  private setupRoutes() {
    const routes = this.routes;
    if (typeof routes === 'object') {
      const defines = routes.defines;
      this.constants = defines.constants;
      this.params = defines.params;
      delete routes.defines;
    }

    this.prepareApi(routes);
  }

  private prepareApi(struct: any, baseType?: string) {
    baseType = baseType || '';

    const self: OctaneVanilla | any = this;
    Object.keys(struct).forEach(function (routePart: string) {
      const block = struct[routePart];
      if (!block) {
        return;
      }

      const messageType = baseType + '/' + routePart;
      if (block.url && block.params) {
        const parts = messageType.split('/');
        const section = utils.toCamelCase(parts[1].toLowerCase(), true);
        parts.splice(0, 2);
        const funcName = utils.toCamelCase(parts.join('-'), true);

        if (!self[section]) {
          self[section] = {};
          self[utils.toCamelCase('get-' + section + '-api', true)] =
            function () {
              return self[section];
            };
        }

        self[section][funcName] = function (msg: any, callback: any) {
          debug('#%s.%s %j', section, funcName, msg);

          if (!self.requestor) {
            const err = new Error.Unauthorized('authentication is required');
            self.sendError(err, msg, block, callback);
          }

          try {
            self.parseParams(msg, block.params);
          } catch (ex) {
            self.sendError(ex, msg, block, callback);
            return;
          }

          self.handler(msg, JSON.parse(JSON.stringify(block)), callback);
        };
      } else {
        self.prepareApi(block, messageType);
      }
    });
  }

  private parseParams(msg: any | any[], paramsStruct: { [x: string]: any }) {
    const self = this;
    if (msg instanceof Array) {
      msg.forEach((entry) => self.parseParams(entry, paramsStruct));
      return;
    }

    const params = Object.keys(paramsStruct);

    for (let i = 0, l = params.length; i < l; i++) {
      let paramName = params[i];

      let def;
      if (paramName.charAt(0) === '$') {
        paramName = paramName.substr(1);
        if (self.params[paramName]) {
          def = paramsStruct[paramName] = self.params[paramName];
          delete paramsStruct[`$${paramName}`];
        } else {
          throw new Error.BadRequest(
            `Invalid variable parameter name substitution; param '${paramName}' not found in defines block`
          );
        }
      } else {
        def = paramsStruct[paramName];
      }

      let value: any = utils.trim(msg[paramName]);
      if (value === undefined || value === null || value === '') {
        if (def.required) {
          throw new Error.BadRequest(
            `Empty value for parameter '${paramName}': ${value}`
          );
        } else {
          continue;
        }
      }

      value = this.sanitizeParam(paramName, value, def);

      msg[paramName] = value;
    }
  }

  private sanitizeParam(
    paramName: string,
    value: any,
    definition: {
      type: string;
      min_value: number;
      max_value: number;
      max_length: number;
      field_type_data: { multiple: any };
    }
  ) {
    if (!definition.type) {
      return value;
    }

    let isInvalid = false;
    switch (definition.type) {
      case 'integer': {
        const i = parseInt(value, 10);
        if (isNaN(i)) {
          isInvalid = false;
        } else {
          if (
            (definition.min_value && i < definition.min_value) ||
            (definition.max_value && i > definition.max_value)
          ) {
            isInvalid = false;
          } else {
            value = i;
          }
        }
        break;
      }
      case 'boolean': {
        if (typeof value !== 'boolean') {
          isInvalid = true;
        }
        break;
      }
      case 'datetime':
      case 'date': {
        const d = new Date(value);
        if (isNaN(d.getTime())) {
          isInvalid = true;
        } else {
          value = d.toISOString();
        }
        break;
      }
      case 'string':
      case 'memo': {
        if (typeof value !== 'string') {
          isInvalid = true;
        } else {
          if (definition.max_length && value.length > definition.max_length) {
            isInvalid = true;
          }
        }
        break;
      }
      case 'object': {
        if (typeof value !== 'object') {
          isInvalid = true;
        }
        break;
      }
      case 'reference': {
        let ref;
        const multiple = definition.field_type_data.multiple;
        if (multiple) {
          ref = MultiReference.parse(value);
        } else {
          ref = Reference.parse(value);
        }
        if (ref) {
          value = ref;
        } else {
          isInvalid = true;
        }
        break;
      }
      case 'query': {
        if (value instanceof Query) {
          value = '"' + value.build() + '"';
        } else {
          isInvalid = true;
        }
        break;
      }
      case 'file': {
        if (typeof value !== 'string') {
          isInvalid = true;
        } else {
          if (path.isAbsolute(value)) {
            value = fs.createReadStream(value);
          } else {
            isInvalid = true;
          }
        }
        break;
      }
      default: {
        throw new Error.BadRequest(
          "Unknown parameter type for parameter '" +
            paramName +
            "': " +
            definition.type
        );
      }
    }

    if (isInvalid) {
      throw new Error.BadRequest(
        "Invalid value for parameter '" + paramName + "': " + typeof value ===
        'object'
          ? JSON.stringify(value)
          : value
      );
    }

    return value;
  }

  private handler(
    msg: any,
    block: any,
    callback: (arg0: null, arg1?: undefined) => void,
    retryIfUnauthorized = true
  ) {
    this.httpSend(msg, block, (err: any, response: any, body: any) => {
      if (err) {
        return this.sendError(err, msg, block, callback);
      }

      debug('status %d', response.statusCode);

      if (response.statusCode === 401) {
        if (retryIfUnauthorized) {
          debug('Trying to reauthenticate');
          return this.authenticate((err: any) => {
            if (err) {
              callback(err);
            } else {
              this.handler(msg, block, callback, false);
            }
          });
        } else {
          err = new Error(response.statusCode, body, response.headers);
          return this.sendError(err, msg, block, callback);
        }
      }

      if (response.statusCode >= 400) {
        err = new Error(response.statusCode, body, response.headers);
        return this.sendError(err, msg, block, callback);
      }

      let ret = body;
      if (response.headers['content-type'] === 'application/octet-stream') {
        ret = body;
      } else if (
        response.req.method === 'GET' ||
        response.request.method === 'GET'
      ) {
        if ('total_count' in ret && 'data' in ret) {
          const totalCount = ret.total_count;
          ret = ret.data;
          ret.meta = { total_count: totalCount };
        }
      } else if (response.req.method === 'POST') {
        if ('data' in ret && ret.data.length === 1) {
          ret = ret.data[0];
        }
      }

      if (callback && typeof callback === 'function') {
        callback(null, ret);
      }
    });
  }

  private convertBlockToBody(
    msg: { [x: string]: any },
    block: { params: {}; url: string }
  ) {
    const body: any = {};
    Object.keys(block.params).forEach(function (paramName) {
      paramName = paramName.replace(/^[$]+/, '');
      if (!(paramName in msg)) {
        return;
      }

      const paramValue = msg[paramName];
      const isUrlParam = block.url.indexOf(':' + paramName) !== -1;
      if (isUrlParam) {
        block.url = block.url.replace(':' + paramName, paramValue);
      } else {
        body[paramName] = paramValue;
      }
    });

    return body;
  }

  private httpSend(
    msg: any[],
    block: {
      params: any;
      ['content-type']: string;
      method: string;
      accept: any;
      url: any;
    },
    callback: request.RequestCallback | undefined
  ) {
    const self = this;
    let body: any = {};
    const method = block.method.toUpperCase();
    const accept = block.accept;
    const contentType = block['content-type'];

    if (msg instanceof Array) {
      body.data = msg.map(
        (entry) => self.convertBlockToBody(entry, block),
        self
      );
    } else if (
      method === 'POST' &&
      (!contentType || contentType !== 'multipart/form-data')
    ) {
      body.data = [self.convertBlockToBody(msg, block)];
    } else {
      body = self.convertBlockToBody(msg, block);
    }

    const url = block.url;
    const options: {
      uri: string;
      method: string;
      formData?: any;
      body?: any;
      headers?: object;
      encoding?: string | null;
      qs?: any;
    } = {
      uri: url,
      method: method,
    };
    if (Object.keys(body)) {
      if ('HEAD|GET|DELETE'.indexOf(method) !== -1) {
        options.qs = body;
      } else if (
        method === 'POST' &&
        contentType &&
        contentType === 'multipart/form-data'
      ) {
        const content = body.file;
        delete body.file;
        const entity = JSON.stringify(body);
        options.formData = {
          entity: {
            value: entity,
            options: {
              contentType: 'application/json',
            },
          },
          content: content,
        };
      } else {
        options.body = body;
      }
    }
    if (accept && accept === 'application/octet-stream') {
      options.headers = { accept: 'application/octet-stream' };
      options.encoding = null;
    }

    debug('sendHttp %j', options);
    this.requestor(options, callback);
  }

  private sendError(err: unknown, msg: any, block: any, callback: (arg0: any) => void) {
    debug('error %j', err);
    debug('block %j', block);
    debug('msg %j', msg);

    if (typeof err === 'string') {
      err = new Error.InternalServerError(err);
    }

    if (callback && typeof callback === 'function') {
      callback(err);
    }
  }
}

export default OctaneVanilla;
/**
 * Octane API access credentials
 * @typedef {Object} OctaneApiCredentials
 * @property {String} client_id - API client id
 * @property {String} client_secret - API client secret
 *
 * Octane User credentials
 * @typedef {Object} OctaneUserCredentials
 * @property {String} username - username
 * @property {String} password - password
 *
 * Octane User credentials
 * @typedef {OctaneUserCredentials|OctaneApiCredentials} OctaneCredentials
 *
 * @callback OctaneVanilla~authenticateCallback
 * @param {Object} - error that occurred
 */
