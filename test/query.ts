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

/* eslint-env mocha */

import assert from 'assert';
import Query from '../lib/query';

describe('query', () => {
  it('should test equality', () => {
    const expect = 'id EQ 5';
    const query = Query.field('id').equal(5);
    assert.strictEqual(query.build(), expect);
  });

  it('should test string equality', () => {
    const expect = 'name EQ ^test^';
    const query = Query.field('name').equal('test');
    assert.strictEqual(query.build(), expect);
  });

  it('should test date format', () => {
    const now = new Date();
    const expect = `created_name LT ^${now.toISOString()}^`;
    const query = Query.field('created_name').less(now);
    assert.strictEqual(query.build(), expect);
  });

  it('should test "no vlaue"', () => {
    const expect = 'user_tags EQ {id EQ 1001}||user_tags EQ {null}';
    const query = Query.field('user_tags')
      .equal(Query.field('id').equal(1001))
      .or()
      .field('user_tags')
      .equal(Query.NONE);
    assert.strictEqual(query.build(), expect);
  });

  it('should test complex statement or', () => {
    const now = new Date();
    const expect = `created_name LT ^${now.toISOString()}^||id EQ 5028||id EQ 5015`;
    const query = Query.field('created_name')
      .less(now)
      .or(Query.field('id').equal(5028))
      .or(Query.field('id').equal(5015));
    assert.strictEqual(query.build(), expect);

    const query2 = Query.field('created_name')
      .less(now)
      .or()
      .field('id')
      .equal(5028)
      .or()
      .field('id')
      .equal(5015);
    assert.strictEqual(query2.build(), expect);
  });

  it('should test complex statement and negate', () => {
    const expect = '!id GE 5028;!name EQ ^test^';
    const query = Query.field('id')
      .notGreaterEqual(5028)
      .and(Query.field('name').notEqual('test'));
    assert.strictEqual(query.build(), expect);

    const query2 = Query.field('id')
      .notGreaterEqual(5028)
      .and()
      .field('name')
      .notEqual('test');
    assert.strictEqual(query2.build(), expect);
  });

  it('should test complex statement and negate and group', () => {
    const expect = '!(id GE 5028);!(name EQ ^test^)';
    const query = Query.field('id')
      .greaterEqual(5028)
      .group()
      .not()
      .and(Query.field('name').equal('test').group().not());
    assert.strictEqual(query.build(), expect);
  });

  it('should test complex statement with reference', () => {
    const expect = 'user_tags EQ {id EQ 1001};user_tags EQ {id EQ 50000000}';
    const query = Query.field('user_tags')
      .equal(Query.field('id').equal(1001))
      .and(Query.field('user_tags').equal(Query.field('id').equal(50000000)));
    assert.strictEqual(query.build(), expect);

    const query2 = Query.field('user_tags')
      .equal(Query.field('id').equal(1001))
      .and()
      .field('user_tags')
      .equal(Query.field('id').equal(50000000));
    assert.strictEqual(query2.build(), expect);
  });

  it('should test between query (numbers)', () => {
    const expect = 'id BTW 1...4';
    const query = Query.field('id').between(1, 4);
    assert.strictEqual(query.build(), expect);
  });

  it('should test between query (dates)', () => {
    const now = new Date();
    const then = new Date();
    then.setSeconds(now.getSeconds() - 1000);
    const expect = `date BTW ^${then.toISOString()}^...^${now.toISOString()}^`;
    const query = Query.field('date').between(then, now);
    assert.strictEqual(query.build(), expect);
  });

  it('should test inComparison', () => {
    const expect = 'id IN 1,2,3';
    const query = Query.field('id').inComparison([1, 2, 3]);
    assert.strictEqual(query.build(), expect);
  });

  it('should test inComparison (one param)', () => {
    const now = new Date();
    const expect = `id IN ^${now.toISOString()}^`;
    const query = Query.field('id').inComparison([now]);
    assert.strictEqual(query.build(), expect);
  });

  it('should test inComparison (with string not array)', () => {
    const query = Query.field('id').inComparison('1');
    let failed = false;
    try {
      query.build();
      failed = true;
    } catch (e) {}
    if (failed) {
      assert.fail("In Comparison didn't work");
    }
  });

  it('should test null query for string', () => {
    const expect = 'string EQ null';
    const query = Query.field('string').equal(Query.NULL);
    assert.strictEqual(query.build(), expect);
  });

  it('should test null query for reference', () => {
    const expect = 'reference EQ {null}';
    const query = Query.field('reference').equal(Query.NULL_REFERENCE);
    assert.strictEqual(query.build(), expect);
  });
});
