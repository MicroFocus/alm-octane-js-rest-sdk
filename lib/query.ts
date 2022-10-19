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

/** @module octane/query */

import assert from 'assert';

class Query {
  private operator: Function;
  private operand1: any;
  private operand2: any;
  private operand3: any;
  static field: (name: string) => Field;
  static NULL: Query;
  static NULL_REFERENCE: Query;
  static NONE: Query;
  constructor(
    operator: Function,
    operand1?: any,
    operand2?: any,
    operand3?: any
  ) {
    this.operator = operator;
    this.operand1 = operand1;
    this.operand2 = operand2;
    this.operand3 = operand3;
  }

  group() {
    return new Query(group, this);
  }

  not() {
    return new Query(not, this);
  }

  and(q?: undefined): DelayQuery;
  and(q: Query): Query;
  and(q: any): any {
    if (q && q instanceof Query) {
      return new Query(and, this, q);
    } else {
      return new DelayQuery(and, this);
    }
  }

  or(q?: undefined): DelayQuery;
  or(q: Query): Query;
  or(q: any): any {
    if (q && q instanceof Query) {
      return new Query(or, this, q);
    } else {
      return new DelayQuery(or, this);
    }
  }

  build() {
    return this.operator(this.operand1, this.operand2, this.operand3);
  }
}

Query.field = (name) => new Field(name);

Query.NULL = new Query(none, null, null);
Query.NULL_REFERENCE = Query.NONE = new Query(none, null, null);

export default Query;

class DelayQuery {
  operator: Function;
  query: any;
  constructor(operator: Function, query: Query) {
    this.operator = operator;
    this.query = query;
  }

  field(name: string) {
    return new Field(name, this);
  }

  fulfill(query: Query) {
    return new Query(this.operator, this.query, query);
  }
}

class Field {
  name: any;
  delay?: DelayQuery;
  constructor(name: string, delay?: DelayQuery) {
    this.name = name;
    this.delay = delay;
  }

  equal(value: any) {
    const q = new Query(equal, this.name, value);
    return this.fulfillDelay(q);
  }

  notEqual(value: any) {
    const q1 = new Query(equal, this.name, value);
    const q2 = new Query(not, q1);
    return this.fulfillDelay(q2);
  }

  less(value: any) {
    const q = new Query(less, this.name, value);
    return this.fulfillDelay(q);
  }

  notLess(value: any) {
    const q1 = new Query(less, this.name, value);
    const q2 = new Query(not, q1);
    return this.fulfillDelay(q2);
  }

  greater(value: any) {
    const q = new Query(greater, this.name, value);
    return this.fulfillDelay(q);
  }

  notGreater(value: any) {
    const q1 = new Query(greater, this.name, value);
    const q2 = new Query(not, q1);
    return this.fulfillDelay(q2);
  }

  lessEqual(value: any) {
    const q = new Query(lessEqual, this.name, value);
    return this.fulfillDelay(q);
  }

  notLessEqual(value: any) {
    const q1 = new Query(lessEqual, this.name, value);
    const q2 = new Query(not, q1);
    return this.fulfillDelay(q2);
  }

  greaterEqual(value: any) {
    const q = new Query(greaterEqual, this.name, value);
    return this.fulfillDelay(q);
  }

  notGreaterEqual(value: any) {
    const q1 = new Query(greaterEqual, this.name, value);
    const q2 = new Query(not, q1);
    return this.fulfillDelay(q2);
  }

  between(value1: any, value2: any) {
    const q = new Query(between, this.name, value1, value2);
    return this.fulfillDelay(q);
  }

  inComparison(value: any) {
    const q = new Query(inComparison, this.name, value);
    return this.fulfillDelay(q);
  }

  fulfillDelay(query: Query) {
    if (this.delay) {
      return this.delay.fulfill(query);
    } else {
      return query;
    }
  }
}

function equal(f: any, v: any) {
  assert(typeof f === 'string');
  if (typeof v === 'number') {
    return `${f} EQ ${v}`;
  } else if (typeof v === 'boolean') {
    return `${f} EQ ${v}`;
  } else if (typeof v === 'string') {
    return `${f} EQ ^${v}^`;
  } else if (v instanceof Date) {
    return `${f} EQ ^${v.toISOString()}^`;
  } else if (v === Query.NULL) {
    return `${f} EQ ${v.build()}`;
  } else if (v instanceof Query) {
    return `${f} EQ {${v.build()}}`;
  } else {
    assert(false, `Not supported data type: ${v}`);
  }
}

function less(f: any, v: any) {
  return compare(f, v, 'LT');
}

function greater(f: any, v: any) {
  return compare(f, v, 'GT');
}

function lessEqual(f: any, v: any) {
  return compare(f, v, 'LE');
}

function greaterEqual(f: any, v: any) {
  return compare(f, v, 'GE');
}

function between(f: any, v: any, w: any) {
  assert(typeof f === 'string');
  assert(
    (typeof v === 'number' && typeof w === 'number') ||
      (v instanceof Date && w instanceof Date)
  );
  if (typeof v === 'number') {
    return `${f} BTW ${v}...${w}`;
  } else if (w instanceof Date) {
    return `${f} BTW ^${v.toISOString()}^...^${w.toISOString()}^`;
  }
}

function inComparison(f: any, v: any) {
  assert(typeof f === 'string');
  assert(Array.isArray(v));
  let hasValueAlready = false;
  let returnString = `${f} IN `;
  v.forEach((value) => {
    if (hasValueAlready) {
      returnString += ',';
    }
    if (typeof value === 'number') {
      returnString += value;
    } else if (typeof value === 'string') {
      returnString += `^${value}^`;
    } else if (value instanceof Date) {
      returnString += `^${value.toISOString()}^`;
    } else if (value instanceof Query) {
      returnString += `{${value.build()}}`;
    } else {
      assert(false, `Not supported data type: ${value}`);
    }
    hasValueAlready = true;
  });

  return returnString;
}

function compare(f: any, v: any, operator: string) {
  assert(typeof f === 'string');
  assert(typeof v === 'number' || v instanceof Date);
  if (typeof v === 'number') {
    return `${f} ${operator} ${v}`;
  } else {
    return `${f} ${operator} ^${v.toISOString()}^`;
  }
}

function group(q: Query) {
  assert(q instanceof Query);
  return `(${q.build()})`;
}

function not(q: Query) {
  assert(q instanceof Query);
  return `!${q.build()}`;
}

function and(q1: Query, q2: Query) {
  assert(q1 instanceof Query);
  assert(q2 instanceof Query);
  return `${q1.build()};${q2.build()}`;
}

function or(q1: Query, q2: Query) {
  assert(q1 instanceof Query);
  assert(q2 instanceof Query);
  return `${q1.build()}||${q2.build()}`;
}

function none() {
  return 'null';
}
