/* eslint-env mocha */

'use strict'

var assert = require('assert')

var Octane = require('../lib')

describe('Otcane', function () {
  it('should create an instance with the required configurations', function () {
    var client = new Octane({
      host: 'octane.hpe.com',
      shared_space_id: 1001,
      workspace_id: 1002
    })

    assert.notEqual(client, null)
  })

  it('should throw exception when the required configurations are not provided', function () {
    assert.throws(function () {
      var client = new Octane({host: 'octane.hpe.com'})
      assert.notEqual(client, null)
    }, Error)
  })
})
