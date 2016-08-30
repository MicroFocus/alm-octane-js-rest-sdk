/* eslint-env mocha */

'use strict'

var assert = require('assert')

var utils = require('../lib/utils')

describe('utils', function () {
  describe('toCamelCase', function () {
    it('should transform a string that contains spaces, underscore, or dashes to CamelCase', function () {
      assert.strictEqual(utils.toCamelCase('bad-request error'), 'BadRequestError')
      assert.strictEqual(utils.toCamelCase('bad_request error'), 'BadRequestError')
    })

    it("should transform a string to camelCase if 'lower' is set 'true'", function () {
      assert.strictEqual(utils.toCamelCase('get-all'), 'GetAll')
      assert.strictEqual(utils.toCamelCase('get-all', false), 'GetAll')
      assert.strictEqual(utils.toCamelCase('get-all', true), 'getAll')
    })
  })

  describe('toDisplayName', function () {
    it('should transform a string that underscore to words', function () {
      assert.strictEqual(utils.toDisplayName('ci_job'), 'ci job')
    })

    it("should transform a string to plural words if 'plural' is set 'true'", function () {
      assert.strictEqual(utils.toDisplayName('ci_job'), 'ci job')
      assert.strictEqual(utils.toDisplayName('ci_job', false), 'ci job')
      assert.strictEqual(utils.toDisplayName('ci_job', true), 'ci jobs')
    })
  })

  describe('trim', function () {
    it('should removes whitespace from both ends of a string', function () {
      assert.strictEqual(utils.trim(' hello world\n'), 'hello world')
      assert.strictEqual(utils.trim(''), '')
    })

    it('should keep variable if not a string', function () {
      assert.strictEqual(utils.trim(undefined), undefined)
      assert.strictEqual(utils.trim(null), null)
      assert.strictEqual(utils.trim(5), 5)
    })
  })
})
