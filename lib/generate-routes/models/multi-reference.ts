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
