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

/* eslint-env mocha */

'use strict'

var assert = require('assert')

var Query = require('../lib/query')

describe('query', function () {
  it('should test equality', function () {
    var expect = 'id EQ 5'
    var query = Query.field('id').equal(5)
    assert.strictEqual(query.build(), expect)
  })

  it('should test string equality', function () {
    var expect = 'name EQ ^test^'
    var query = Query.field('name').equal('test')
    assert.strictEqual(query.build(), expect)
  })

  it('should test date format', function () {
    var now = new Date()
    var expect = 'created_name LT ^' + now.toISOString() + '^'
    var query = Query.field('created_name').less(now)
    assert.strictEqual(query.build(), expect)
  })

  it('should test "no vlaue"', function () {
    var expect = 'user_tags EQ {id EQ 1001}||user_tags EQ {null}'
    var query = Query.field('user_tags').equal(Query.field('id').equal(1001)).or().field('user_tags').equal(Query.NONE)
    assert.strictEqual(query.build(), expect)
  })

  it('should test complex statement or', function () {
    var now = new Date()
    var expect = 'created_name LT ^' + now.toISOString() + '^||id EQ 5028||id EQ 5015'
    var query = Query.field('created_name').less(now).or(Query.field('id').equal(5028)).or(Query.field('id').equal(5015))
    assert.strictEqual(query.build(), expect)

    var query2 = Query.field('created_name').less(now).or().field('id').equal(5028).or().field('id').equal(5015)
    assert.strictEqual(query2.build(), expect)
  })

  it('should test complex statement and negate', function () {
    var expect = '!id GE 5028;!name EQ ^test^'
    var query = Query.field('id').notGreaterEqual(5028).and(Query.field('name').notEqual('test'))
    assert.strictEqual(query.build(), expect)

    var query2 = Query.field('id').notGreaterEqual(5028).and().field('name').notEqual('test')
    assert.strictEqual(query2.build(), expect)
  })

  it('should test complex statement and negate and group', function () {
    var expect = '!(id GE 5028);!(name EQ ^test^)'
    var query = Query.field('id').greaterEqual(5028).group().not().and(Query.field('name').equal('test').group().not())
    assert.strictEqual(query.build(), expect)
  })

  it('should test complex statement with reference', function () {
    var expect = 'user_tags EQ {id EQ 1001};user_tags EQ {id EQ 50000000}'
    var query = Query.field('user_tags').equal(Query.field('id').equal(1001)).and(Query.field('user_tags').equal(Query.field('id').equal(50000000)))
    assert.strictEqual(query.build(), expect)

    var query2 = Query.field('user_tags').equal(Query.field('id').equal(1001)).and().field('user_tags').equal(Query.field('id').equal(50000000))
    assert.strictEqual(query2.build(), expect)
  })

  it('should test between query (numbers)', function () {
    var expect = 'id BTW 1...4'
    var query = Query.field('id').between(1,4)
    assert.strictEqual(query.build(), expect)
  })

  it('should test between query (dates)', function () {
    var now = new Date()
    var then = new Date()
    then.setSeconds(now.getSeconds() - 1000)
    var expect = 'date BTW ^' + then.toISOString() + '^...^' + now.toISOString() + '^'
    var query = Query.field('date').between(then, now)
    assert.strictEqual(query.build(), expect)
  })

  it('should test inComparison', function () {
    var expect = 'id IN 1,2,3'
    var query = Query.field('id').inComparison([1, 2, 3])
    assert.strictEqual(query.build(), expect)
  })

  it('should test inComparison (one param)', function () {
    var now = new Date()
    var expect = 'id IN ^' + now.toISOString() + '^'
    var query = Query.field('id').inComparison([now])
    assert.strictEqual(query.build(), expect)
  })

  it('should test inComparison (with string not array)', function () {
    var query = Query.field('id').inComparison('1')
    var failed = false
    try {
      query.build()
      failed = true
    } catch (e) {
    }
    if (failed) {
      assert.fail('In Comparison didn\'t work')
    }
  })

  it('should test null query for string', function () {
    var expect = 'string EQ null'
    var query = Query.field('string').equal(Query.NULL)
    assert.strictEqual(query.build(), expect)
  })

  it('should test null query for reference', function () {
    var expect = 'reference EQ {null}'
    var query = Query.field('reference').equal(Query.NULL_REFERENCE)
    assert.strictEqual(query.build(), expect)
  })
})
