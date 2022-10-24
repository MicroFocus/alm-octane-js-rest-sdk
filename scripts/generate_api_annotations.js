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

const fs = require('fs');
const path = require('path');

const utils = require('../dist/lib/generate-routes/utils');

const DEFAULT_ROUTES_FILE = '../routes/default.json';
const API_ANNOTATIONS_FILE = '../doc/apidoc.js';

function generateAPIAnnotations() {
  console.log('generating api annotations ...');

  let routes;
  let defaultParams;

  console.log('loading default routes file ...');
  try {
    routes = JSON.parse(
      fs.readFileSync(path.join(__dirname, DEFAULT_ROUTES_FILE), 'utf8')
    );
    if (routes.defines) {
      defaultParams = routes.defines.params;
      delete routes.defines;
    }
    defaultParams = defaultParams || {};
  } catch (ex) {
    console.error(ex);
    process.exit(1);
  }

  const apiAnnotations = parseRoutes(routes, defaultParams);

  saveApiAnnotationsToFile(apiAnnotations, API_ANNOTATIONS_FILE);
}

function parseRoutes(routes, defaultParams) {
  console.log('parsing default routes ...');

  let apiAnnotations = '';

  function generateAPI(routes, baseType) {
    baseType = baseType || '';

    Object.keys(routes).forEach(function (routePart) {
      const routeBlock = routes[routePart];
      if (!routeBlock) {
        return;
      }

      const messageType = baseType + '/' + routePart;
      if (routeBlock.url && routeBlock.params) {
        console.log('generating api annotation for ' + messageType + ' ...');
        const parts = messageType.split('/');
        const section = utils.toCamelCase(parts[1].toLowerCase(), true);
        parts.splice(0, 2);
        const funcName = utils.toCamelCase(parts.join('-'), true);

        apiAnnotations += generateAPIAnnotation(
          section,
          funcName,
          routeBlock,
          defaultParams
        );
      } else {
        generateAPI(routeBlock, messageType);
      }
    });
  }

  generateAPI(routes);

  return apiAnnotations;
}

function generateAPIAnnotation(section, funcName, block, defaultParams) {
  const url = block.url;
  const method = block.method.toLowerCase();
  const description = block.description;

  const annotation = [
    '/**',
    ' * @api {' + method + '} ' + encodeURI(url) + ' ' + funcName,
    ' * @apiName ' + funcName,
    ' * @apiDescription ' + description,
    ' * @apiGroup ' + section,
    ' *',
  ];

  const paramsObj = block.params;
  const paramKeys = Object.keys(paramsObj);
  paramKeys.sort(function (paramA, paramB) {
    const cleanParamA = paramA.replace(/^\$/, '');
    const cleanParamB = paramB.replace(/^\$/, '');

    const paramInfoA = paramsObj[paramA] || defaultParams[cleanParamA];
    const paramInfoB = paramsObj[paramB] || defaultParams[cleanParamB];

    const paramRequiredA = paramInfoA.required;
    const paramRequiredB = paramInfoB.required;

    if (paramRequiredA && !paramRequiredB) return -1;
    if (!paramRequiredA && paramRequiredB) return 1;
    return 0;
  });

  paramKeys.forEach(function (param) {
    const cleanParam = param.replace(/^\$/, '');
    const paramInfo = paramsObj[param] || defaultParams[cleanParam];

    const paramType = paramInfo.type;
    const paramRequired = paramInfo.required;

    let paramDescription = paramInfo.description;
    let paramLabel = cleanParam;

    if (!paramRequired) {
      paramLabel = '[' + paramLabel + ']';
    }

    if (paramType === 'integer') {
      if (paramInfo.min_value || paramInfo.max_value) {
        paramDescription +=
          ' (min_value: ' +
          paramInfo.min_value +
          ', max_value: ' +
          paramInfo.max_value +
          ')';
      }
    } else if (paramType === 'string') {
      if (paramInfo.max_length) {
        paramDescription += ' (max_length: ' + paramInfo.max_length + ')';
      }
    } else if (paramType === 'reference') {
      if (paramInfo.field_type_data) {
        paramDescription +=
          ' (multiple: ' + paramInfo.field_type_data.multiple + ')';
      }
    }

    annotation.push(
      ' * @apiParam {' + paramType + '} ' + paramLabel + '  ' + paramDescription
    );
  });

  annotation.push(
    ' * @apiExample {js} ex:\noctane.' + section + '.' + funcName + '({ ... });'
  );

  return annotation.join('\n') + '\n */\n\n';
}

function saveApiAnnotationsToFile(annotations, file) {
  console.log('saving annotations to ' + file + ' ...');
  try {
    fs.writeFileSync(path.join(__dirname, file), annotations);
  } catch (ex) {
    console.log(ex);
    process.exit(1);
  }
}

generateAPIAnnotations();
