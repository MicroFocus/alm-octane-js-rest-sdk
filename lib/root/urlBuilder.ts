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

/**
 * @class
 * This is used to build Octane API resource URLs.
 *
 * @param {Number} sharedSpace - Octane shared space id
 * @param {Number} workspace - Octane workspace id
 */
class UrlBuilder {
  private _sharedSpace: number;
  private _workspace: number;
  private _requestUrl: any;
  private _isFirstParam: boolean;
  constructor(sharedSpace: number, workspace: number) {
    this._sharedSpace = sharedSpace;
    this._workspace = workspace;
    this._isFirstParam = false;

    this.resetRequestUrl();
  }

  setEntityUrl(entityName: string) {
    this._requestUrl.entityName = entityName;
  }

  limit(limit: number) {
    this._requestUrl.limit = limit;
  }

  offset(offset: number) {
    this._requestUrl.offset = offset;
  }

  fields(fieldNames: string[]) {
    this.putFieldNamesInJson(fieldNames, 'fields');
  }

  orderBy(fieldNames: string[]) {
    this.putFieldNamesInJson(fieldNames, 'orderBy');
  }

  query(query: string) {
    this._requestUrl.query = `"${encodeURIComponent(query)}"`;
  }

  queryParameter(name: string, value: any) {
    if (this._requestUrl.queryString) {
      this._requestUrl.queryString = `${this._requestUrl.queryString}&${name}=${value}`;
    } else {
      this._requestUrl.queryString = `${name}=${value}`;
    }
  }

  script() {
    this._requestUrl.script = true;
  }

  /**
   * The fieldNames are assigned to the requestUrl.jsonPropertyName as a single string containing fieldNames separated
   * by commas
   *
   * @param {Object} fieldNames - The fields will be added to the request URL in the 'jsonProperty' parameter.
   * @param jsonProperty - The name of the property which will be added to the URL
   */
  putFieldNamesInJson(fieldNames: string[], jsonProperty: string) {
    this._requestUrl[jsonProperty] = '';
    let isFirst = true;
    fieldNames.forEach((fieldName) => {
      if (isFirst) {
        this._requestUrl[
          jsonProperty
        ] = `${this._requestUrl[jsonProperty]}${fieldName}`;
        isFirst = false;
      } else {
        this._requestUrl[
          jsonProperty
        ] = `${this._requestUrl[jsonProperty]},${fieldName}`;
      }
    });
  }

  at(id: number) {
    this._requestUrl.at = id;
  }

  /**
   * @returns {String} - An Octane API URL
   */
  build(): string {
    this._isFirstParam = true;

    let builtUrl = '';

    if (this._requestUrl.entityName) {
      builtUrl = `${builtUrl}/api/shared_spaces/${this._sharedSpace}/workspaces/${this._workspace}/${this._requestUrl.entityName}`;
    }
    if (this._requestUrl.at) {
      builtUrl = `${builtUrl}/${this._requestUrl.at}`;
      if (this._requestUrl.script && this._requestUrl.entityName === 'tests') {
        builtUrl = `${builtUrl}/script`;
      }
      if (this._requestUrl.fields) {
        builtUrl = this.addParam(builtUrl, 'fields', this._requestUrl.fields);
      }
      this.resetRequestUrl();
      return builtUrl;
    }

    if (this._requestUrl.queryString) {
      this._isFirstParam = false;
      builtUrl = `${builtUrl}?${this._requestUrl.queryString}`;
    }
    if (this._requestUrl.fields) {
      builtUrl = this.addParam(builtUrl, 'fields', this._requestUrl.fields);
    }
    if (this._requestUrl.limit) {
      builtUrl = this.addParam(builtUrl, 'limit', this._requestUrl.limit);
    }
    if (this._requestUrl.offset) {
      builtUrl = this.addParam(builtUrl, 'offset', this._requestUrl.offset);
    }
    if (this._requestUrl.query) {
      builtUrl = this.addParam(builtUrl, 'query', this._requestUrl.query);
    }
    if (this._requestUrl.orderBy) {
      builtUrl = this.addParam(builtUrl, 'order_by', this._requestUrl.orderBy);
    }

    this.resetRequestUrl();
    return builtUrl;
  }

  /**
   * Adds a query parameter to the builtUrl
   *
   * @returns - A new URL containing the query parameters.
   */
  addParam(builtUrl: string, paramName: string, paramValue: any) {
    if (this._isFirstParam) {
      builtUrl = `${builtUrl}?${paramName}=${paramValue}`;
      this._isFirstParam = false;
    } else {
      builtUrl = `${builtUrl}&${paramName}=${paramValue}`;
    }
    return builtUrl;
  }

  resetRequestUrl() {
    this._requestUrl = {
      sharedSpace: this._sharedSpace,
      workspace: this._workspace,
      entityName: null,
      at: null,
      fields: null,
      limit: null,
      offset: null,
      query: null,
      queryString: null,
      orderBy: null,
      script: false,
    };
  }
}

export default UrlBuilder;
