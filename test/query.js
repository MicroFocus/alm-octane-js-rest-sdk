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

    // fail
    // var query2 = Query.field('id').greaterEqual(5028).group().not().and().field('name').equal('test').group().not()
    // assert.strictEqual(query2.build(), expect)
  })

  it('should test complex statement with reference', function () {
    var expect = 'user_tags EQ {id EQ 1001};user_tags EQ {id EQ 50000000}'
    var query = Query.field('user_tags').equal(Query.field('id').equal(1001)).and(Query.field('user_tags').equal(Query.field('id').equal(50000000)))
    assert.strictEqual(query.build(), expect)

    var query2 = Query.field('user_tags').equal(Query.field('id').equal(1001)).and().field('user_tags').equal(Query.field('id').equal(50000000))
    assert.strictEqual(query2.build(), expect)
  })
})
