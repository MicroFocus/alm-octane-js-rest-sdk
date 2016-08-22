/* eslint-env mocha */

'use strict'

var assert = require('assert')

var error = require('../lib/error')

describe('error', function () {
  describe('HttpError', function () {
    var err

    beforeEach(function () {
      err = new error.HttpError('error message', 500, null)
    })

    it('should create an instance which inherits Error', function () {
      assert(err instanceof Error)
    })

    describe('#toString', function () {
      it('should return the message', function () {
        assert.strictEqual(String(err), 'error message')
      })
    })

    describe('#toJSON', function () {
      it('should return an object', function () {
        assert.deepStrictEqual(
          err.toJSON(),
          {
            code: 500,
            status: 'Internal Server Error',
            message: 'error message'
          }
        )
      })
    })
  })

  describe('BadRequest', function () {
    it('should create an instance which inherits HttpError', function () {
      var err = new error.BadRequest()
      assert(err instanceof error.HttpError)
    })

    it('should create an instance with default message', function () {
      var err = new error.BadRequest()
      assert.strictEqual(String(err), '400:Bad Request')
      assert.deepStrictEqual(
        err.toJSON(),
        {
          code: '400',
          status: 'Bad Request',
          message: '400:Bad Request'
        }
      )
    })

    it('should create an instance with specified message', function () {
      var err = new error.BadRequest('Invalid parameter')
      assert.strictEqual(String(err), 'Invalid parameter')
      assert.deepStrictEqual(
        err.toJSON(),
        {
          code: '400',
          status: 'Bad Request',
          message: 'Invalid parameter'
        }
      )
    })
  })
})
