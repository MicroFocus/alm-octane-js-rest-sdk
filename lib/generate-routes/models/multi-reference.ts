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

/** @module octane/models/multiReference */

import assert from 'assert';
import Reference from './reference';

/**
 * @class
 *
 * @param {Reference[]} refs - the references
 */
class MultiReference {
  refs: Reference[];
  static parse: (vals: any) => MultiReference | null;
  constructor(refs: Reference[]) {
    refs.forEach((ref) => {
      assert(ref instanceof Reference);
    });

    this.refs = refs;
  }

  toJSON() {
    return {
      total_count: this.refs.length,
      data: this.refs,
    };
  }

  /**
   * Adds a new {Reference} and returns this instance
   * @param ref
   * @returns {MultiReference}
   */
  addReference(ref: Reference): MultiReference {
    assert(ref instanceof Reference);
    this.refs.push(ref);
    return this;
  }
}

MultiReference.parse = (vals) => {
  if (vals instanceof MultiReference) {
    return new MultiReference(vals.refs);
  }

  const refs = [];
  for (let i = 0, l = vals.length; i < l; i++) {
    const ref = Reference.parse(vals[i]);

    if (ref) {
      refs.push(ref);
    } else {
      return null;
    }
  }

  return new MultiReference(refs);
};

export default MultiReference;
