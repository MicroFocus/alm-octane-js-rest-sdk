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

/** @module octane/utils */

import pluralize from 'pluralize';

/**
 *  Shallow copy of properties from the `src` object to the `dest` object. If the
 *  `noOverwrite` argument is set to to `true`, the value of a property in `src`
 *  will not be overwritten if it already exists.
 *
 * @param {Object} dest - destination object
 * @param {Object} src - source object
 * @param {Boolean} noOverwrite - set to `true` to overwrite values in `src`
 **/
export const extend = function extend(
  dest: { [x: string]: any },
  src: { [x: string]: any },
  noOverwrite: boolean
) {
  for (const prop in src) {
    if (!noOverwrite || typeof dest[prop] === 'undefined') {
      dest[prop] = src[prop];
    }
  }
  return dest;
};

/**
 * Transform a string that contains spaces, underscore, or dashes to CamelCase.
 * If 'lower' is set to 'true', the string will be transformed to camelCase.
 *
 * @param {String} str - string to transform
 * @param {Boolean} [lower] - set to 'true' to transform to camelCase
 */
export const toCamelCase = (str: string, lower?: boolean) => {
  str = str
    .toLowerCase()
    .replace(/(?:(^.)|(\s+.)|(_.)|(-.))/g, (match: string) =>
      match.charAt(match.length - 1).toUpperCase()
    );
  if (lower) {
    str = str.charAt(0).toLowerCase() + str.substr(1);
  }
  return str;
};

/**
 * Transform a string that contains underscore to words.
 * If 'plural' is set to 'true', the string will be transformed to the plural words.
 *
 * @param {String} str - string to transform
 * @param {Boolean} [plural] - set to 'true' to transform to the plural words
 */
export const toDisplayName = function toDisplayName(
  str: string,
  plural?: boolean
) {
  const words = str.toLowerCase().split('_');
  if (plural && words.length > 0) {
    const index = words.length - 1;
    words[index] = pluralize.plural(words[index]);
  }
  return words.join(' ');
};

/**
 * Remove whitespace from both sides of a string.
 * If 'str' is not a string, return it directly.
 *
 * @param {String} str - string to trim
 */
export const trim = function trim(str: string | number | null | undefined) {
  if (typeof str !== 'string') {
    return str;
  }

  return str.replace(/^[\s\t\r\n]+/, '').replace(/[\s\t\r\n]+$/, '');
};
