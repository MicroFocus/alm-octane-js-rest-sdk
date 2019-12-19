/*!
 * (c) 2016-2018 EntIT Software LLC, a Micro Focus company
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

const assert = require('assert')

class Query {
  constructor (operator, operand1, operand2, operand3) {
    this.operator = operator
    this.operand1 = operand1
    this.operand2 = operand2
    this.operand3 = operand3
  }

  group () {
    return new Query(group, this)
  }

  not () {
    return new Query(not, this)
  }

  and (q) {
    if (q) {
      return new Query(and, this, q)
    } else {
      return new DelayQuery(and, this)
    }
  }

  or (q) {
    if (q) {
      return new Query(or, this, q)
    } else {
      return new DelayQuery(or, this)
    }
  }

  build () {
    return this.operator(this.operand1, this.operand2, this.operand3)
  }
}

Query.field = name => new Field(name)

Query.NULL = new Query(none, null, null)
Query.NULL_REFERENCE = Query.NONE = new Query(none, null, null)

module.exports = Query

class DelayQuery {
  constructor (operator, query) {
    this.operator = operator
    this.query = query
  }

  field (name) {
    return new Field(name, this)
  }

  fulfill (query) {
    return new Query(this.operator, this.query, query)
  }
}

class Field {
  constructor (name, delay) {
    this.name = name
    this.delay = delay
  }

  equal (value) {
    const q = new Query(equal, this.name, value)
    return this.fulfillDelay(q)
  }

  notEqual (value) {
    const q1 = new Query(equal, this.name, value)
    const q2 = new Query(not, q1)
    return this.fulfillDelay(q2)
  }

  less (value) {
    const q = new Query(less, this.name, value)
    return this.fulfillDelay(q)
  }

  notLess (value) {
    const q1 = new Query(less, this.name, value)
    const q2 = new Query(not, q1)
    return this.fulfillDelay(q2)
  }

  greater (value) {
    const q = new Query(greater, this.name, value)
    return this.fulfillDelay(q)
  }

  notGreater (value) {
    const q1 = new Query(greater, this.name, value)
    const q2 = new Query(not, q1)
    return this.fulfillDelay(q2)
  }

  lessEqual (value) {
    const q = Query(lessEqual, this.name, value)
    return this.fulfillDelay(q)
  }

  notLessEqual (value) {
    const q1 = new Query(lessEqual, this.name, value)
    const q2 = new Query(not, q1)
    return this.fulfillDelay(q2)
  }

  greaterEqual (value) {
    const q = new Query(greaterEqual, this.name, value)
    return this.fulfillDelay(q)
  }

  notGreaterEqual (value) {
    const q1 = new Query(greaterEqual, this.name, value)
    const q2 = new Query(not, q1)
    return this.fulfillDelay(q2)
  }

  between (value1, value2) {
    const q = new Query(between, this.name, value1, value2)
    return this.fulfillDelay(q)
  }

  inComparison (value) {
    const q = new Query(inComparison, this.name, value)
    return this.fulfillDelay(q)
  }

  fulfillDelay (query) {
    if (this.delay) {
      return this.delay.fulfill(query)
    } else {
      return query
    }
  }
}

function equal (f, v) {
  assert(typeof f === 'string')
  if (typeof v === 'number') {
    return `${f} EQ ${v}`
  } else if (typeof v === 'boolean') {
    return `${f} EQ ${v}`
  } else if (typeof v === 'string') {
    return `${f} EQ ^${v}^`
  } else if (v instanceof Date) {
    return `${f} EQ ^${v.toISOString()}^`
  } else if (v === Query.NULL) {
    return `${f} EQ ${v.build()}`
  } else if (v instanceof Query) {
    return `${f} EQ {${v.build()}}`
  } else {
    assert(false, `Not supported data type: ${v}`)
  }
}

function less (f, v) {
  return compare(f, v, 'LT')
}

function greater (f, v) {
  return compare(f, v, 'GT')
}

function lessEqual (f, v) {
  return compare(f, v, 'LE')
}

function greaterEqual (f, v) {
  return compare(f, v, 'GE')
}

function between (f, v, w) {
  assert(typeof f === 'string')
  assert((typeof v === 'number' && typeof w === 'number') || (v instanceof Date && w instanceof Date))
  if (typeof v === 'number') {
    return `${f} BTW ${v}...${w}`
  } else {
    return `${f} BTW ^${v.toISOString()}^...^${w.toISOString()}^`
  }
}

function inComparison (f, v) {
  assert(typeof f === 'string')
  assert(Array.isArray(v))
  let hasValueAlready = false
  let returnString = `${f} IN `
  v.forEach(value => {
    if (hasValueAlready) {
      returnString += ','
    }
    if (typeof value === 'number') {
      returnString += value
    } else if (typeof value === 'string') {
      returnString += `^${value}^`
    } else if (value instanceof Date) {
      returnString += `^${value.toISOString()}^`
    } else if (value instanceof Query) {
      returnString += `{${value.build()}}`
    } else {
      assert(false, `Not supported data type: ${value}`)
    }
    hasValueAlready = true
  })

  return returnString
}

function compare (f, v, operator) {
  assert(typeof f === 'string')
  assert(typeof v === 'number' || v instanceof Date)
  if (typeof v === 'number') {
    return `${f} ${operator} ${v}`
  } else {
    return `${f} ${operator} ^${v.toISOString()}^`
  }
}

function group (q) {
  assert(q instanceof Query)
  return `(${q.build()})`
}

function not (q) {
  assert(q instanceof Query)
  return `!${q.build()}`
}

function and (q1, q2) {
  assert(q1 instanceof Query)
  assert(q2 instanceof Query)
  return `${q1.build()};${q2.build()}`
}

function or (q1, q2) {
  assert(q1 instanceof Query)
  assert(q2 instanceof Query)
  return `${q1.build()}||${q2.build()}`
}

function none () {
  return 'null'
}
