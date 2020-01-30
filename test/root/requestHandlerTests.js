/*!
 * (c) Copyright 2020 Micro Focus or one of its affiliates.
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

const assert = require('assert')
const RequestHandler = require('../../lib/root/requestHandler')
const nock = require('nock')
const nockServerUrl = 'https://myNockServer.com'
const uri = '/some/uri'
const user = 'MyUser'
const password = 'MyPassword'
const UNAUTHORIZED_ERROR = {
  name: 'StatusCodeError',
  statusCode: 401
}

describe('requestHandler', function () {
  this.slow(350)
  let requestHandler
  beforeEach(() => {
    const requestHandlerInitialization = { user: user, password: password, server: nockServerUrl }
    requestHandler = new RequestHandler(requestHandlerInitialization)
  })

  async function throwsUnauthorizedException (promise) {
    await throwsException(promise, UNAUTHORIZED_ERROR)
  }
  async function throwsException (promise, exception) {
    await assert.rejects(promise, exception)
  }
  function wrapInErrorMessage (message) {
    return { message: 'Error: ' + message }
  }

  describe('#authenticate', () => {
    it('makes a successful authentication request with the given username and password', async () => {
      const scope = BuildServerResponses()
        .withSuccessfulAuthentication(user, password)
        .build()
      const shouldBeUndefined = await requestHandler.authenticate()
      await assert.strictEqual(shouldBeUndefined, undefined)
      scope.done()
    })
    it('throws an error after failed authentication', async () => {
      const scope = BuildServerResponses()
        .withUnsuccessfulAuthentication()
        .build()
      await throwsUnauthorizedException(requestHandler.authenticate())
      scope.done()
    })
  })
  describe('#get', () => {
    it('throws an error in case of an error response different from 401', async () => {
      const errorMessage = 'Failed as intended'
      const scope = BuildServerResponses()
        .withUnsuccessfulGetRequest(uri, errorMessage)
        .build()
      await throwsException(requestHandler.get(uri), wrapInErrorMessage(errorMessage))
      scope.done()
    })
    it('throws an error if request was answered with status code 401 two times', async () => {
      const scope = BuildServerResponses()
        .withUnauthorizedGetRequest(uri)
        .withSuccessfulAuthentication()
        .withUnauthorizedGetRequest(uri)
        .build()
      await throwsUnauthorizedException(requestHandler.get(uri))
      scope.done()
    })
    it('throws an error if request was answered with status code 401 and authentication fails', async () => {
      const scope = BuildServerResponses()
        .withUnauthorizedGetRequest(uri)
        .withUnsuccessfulAuthentication()
        .build()
      await throwsUnauthorizedException(requestHandler.get(uri))
      scope.done()
    })
    it('returns the data even if the 1st request was with the status code 401', async function () {
      const objectToGet = 'Request was successful'
      const scope = BuildServerResponses()
        .withUnauthorizedGetRequest(uri)
        .withSuccessfulAuthentication()
        .withGetRequest(uri, 200, objectToGet)
        .build()
      const objectGot = await requestHandler.get(uri)
      assert.strictEqual(objectGot, objectToGet)
      scope.done()
    })
    it('makes a successful get request', async function () {
      const objectToGet = 'Request was successful'
      const scope = BuildServerResponses()
        .withGetRequest(uri, 200, objectToGet)
        .build()
      const objectGot = await requestHandler.get(uri)
      assert.strictEqual(objectGot, objectToGet)
      scope.done()
    })
  })

  describe('#delete', () => {
    it('throws an error in case of an error response different from 401', async () => {
      const errorMessage = 'Failed as intended'
      const scope = BuildServerResponses()
        .withUnsuccessfulDeleteRequest(uri, errorMessage)
        .build()
      await throwsException(requestHandler.delete(uri), wrapInErrorMessage(errorMessage))
      scope.done()
    })
    it('throws an error if request was answered with status code 401 two times', async function () {
      const scope = BuildServerResponses()
        .withUnauthorizedDeleteRequest(uri)
        .withSuccessfulAuthentication()
        .withUnauthorizedDeleteRequest(uri)
        .build()
      await throwsUnauthorizedException(requestHandler.delete(uri))
      scope.done()
    })
    it('throws an error if request was answered with status code 401 and authentication fails', async () => {
      const scope = BuildServerResponses()
        .withUnauthorizedDeleteRequest(uri)
        .withUnsuccessfulAuthentication()
        .build()
      await throwsUnauthorizedException(requestHandler.delete(uri))
      scope.done()
    })
    it('request is made even if 1st request was with the status code 401', async function () {
      const scope = BuildServerResponses()
        .withUnauthorizedDeleteRequest(uri)
        .withSuccessfulAuthentication()
        .withDeleteRequest(uri, 200)
        .build()
      const shouldBeUndefined = await requestHandler.delete(uri)
      assert.strictEqual(shouldBeUndefined, undefined)
      scope.done()
    })
    it('makes a successful delete request', async function () {
      const scope = BuildServerResponses()
        .withDeleteRequest(uri, 200)
        .build()
      const shouldBeUndefined = await requestHandler.delete(uri)
      assert.strictEqual(shouldBeUndefined, undefined)
      scope.done()
    })
  })

  describe('#update', () => {
    it('throws an error in case of an error response different from 401', async () => {
      const error = 'Failed as intended!'
      const scope = BuildServerResponses()
        .withUnsuccessfulUpdateRequest(uri, error)
        .build()
      await throwsException(requestHandler.update(uri), wrapInErrorMessage(error))
      scope.done()
    })
    it('throws an error if request was answered with status code 401 two times', async function () {
      const scope = BuildServerResponses()
        .withUnauthorizedUpdateRequest(uri)
        .withSuccessfulAuthentication()
        .withUnauthorizedUpdateRequest(uri)
        .build()
      await throwsUnauthorizedException(requestHandler.update(uri))
      scope.done()
    })
    it('throws an error if request was answered with status code 401 and authentication fails', async () => {
      const scope = BuildServerResponses()
        .withUnauthorizedUpdateRequest(uri)
        .withUnsuccessfulAuthentication()
        .build()
      await throwsUnauthorizedException(requestHandler.update(uri))
      scope.done()
    })
    it('request is made even if 1st request was with the status code 401', async function () {
      const updatedObject = 'Success'
      const updateBody = {
        parameter1: 'para 1',
        parameter2: 2
      }
      const scope = BuildServerResponses()
        .withUnauthorizedUpdateRequest(uri)
        .withSuccessfulAuthentication()
        .withUpdateRequest(uri, 200, updateBody, updatedObject)
        .build()
      const responseObject = await requestHandler.update(uri, updateBody)
      assert.strictEqual(responseObject, updatedObject)
      scope.done()
    })
    it('makes a successful update request', async function () {
      const updatedObject = 'Success'
      const updateBody = {
        parameter1: 'para 1',
        parameter2: 2
      }
      const scope = BuildServerResponses()
        .withUpdateRequest(uri, 200, updateBody, updatedObject)
        .build()
      const responseObject = await requestHandler.update(uri, updateBody)
      assert.strictEqual(responseObject, updatedObject)
      scope.done()
    })
  })
  describe('#create', () => {
    it('throws an error in case of an error response different from 401', async () => {
      const error = 'Failed as intended!'
      const scope = BuildServerResponses()
        .withUnsuccessfulCreateRequest(uri, error)
        .build()
      await throwsException(requestHandler.create(uri), wrapInErrorMessage(error))
      scope.done()
    })
    it('throws an error if request was answered with status code 401 two times', async function () {
      const scope = BuildServerResponses()
        .withUnauthorizedCreateRequest(uri)
        .withSuccessfulAuthentication()
        .withUnauthorizedCreateRequest(uri)
        .build()
      await throwsUnauthorizedException(requestHandler.create(uri))
      scope.done()
    })
    it('throws an error if request was answered with status code 401 and authentication fails', async () => {
      const scope = BuildServerResponses()
        .withUnauthorizedCreateRequest(uri)
        .withUnsuccessfulAuthentication()
        .build()
      await throwsUnauthorizedException(requestHandler.create(uri))
      scope.done()
    })
    it('request is made even if 1st request was with the status code 401', async function () {
      const createObject = 'Success'
      const createBody = {
        parameter1: 'para 1',
        parameter2: 2
      }
      const scope = BuildServerResponses()
        .withUnauthorizedCreateRequest(uri)
        .withSuccessfulAuthentication()
        .withCreateRequest(uri, 200, createBody, createObject)
        .build()
      const responseObject = await requestHandler.create(uri, createBody)
      assert.strictEqual(responseObject, createObject)
      scope.done()
    }).timeout(200000)
    it('makes a successful update request', async function () {
      const createObject = 'Success'
      const createBody = {
        parameter1: 'para 1',
        parameter2: 2
      }
      const scope = BuildServerResponses()
        .withCreateRequest(uri, 200, createBody, createObject)
        .build()
      const responseObject = await requestHandler.create(uri, createBody)
      assert.strictEqual(responseObject, createObject)
      scope.done()
    })
  })
  describe('#reauthenicate', () => {
    it('throws the error given if it does not have the status code 401', async () => {
      const errorWithoutStatusCode = new Error('My Simple Error')
      const errorWithStatusCode = new Error('My Status Code Error')
      errorWithStatusCode.statusCode = 404
      await throwsException(requestHandler._reauthenticate(errorWithoutStatusCode), errorWithoutStatusCode)
      await throwsException(requestHandler._reauthenticate(errorWithStatusCode), errorWithStatusCode)
    })
    it('throws an error if the error received has status code 401 and the authentication fails ', async function () {
      const scope = BuildServerResponses().withUnsuccessfulAuthentication().build()
      await throwsUnauthorizedException(requestHandler._reauthenticate(UNAUTHORIZED_ERROR))
      scope.done()
    })
    it('authenticates again if the received error has the status code 401', async function () {
      const scope = BuildServerResponses().withSuccessfulAuthentication().build()
      const shouldBeUndefined = await requestHandler._reauthenticate(UNAUTHORIZED_ERROR)
      assert.strictEqual(shouldBeUndefined, undefined)
      scope.done()
    })
  })
  describe('#signOut', () => {
    it('throws an error if the request fails', async function () {
      const scope = BuildServerResponses()
        .withUnsuccessfulSignOut()
        .build()
      await throwsUnauthorizedException(requestHandler.signOut())
      scope.done()
    })
    it('throws an error if the request fails', async function () {
      const scope = BuildServerResponses()
        .withSuccessfulSignOut()
        .build()
      const shouldBeUndefined = await requestHandler.signOut()
      assert.strictEqual(shouldBeUndefined, undefined)
      scope.done()
    })
  })
  afterEach(() => {
    nock.cleanAll()
  })

  function BuildServerResponses () {
    const scope = nock(nockServerUrl)
    const authenticatedCookie = 'Authenticated'
    const loginCookieName = 'LWSSO_COOKIE_KEY'
    const serverDelay = 100
    return {
      withSuccessfulAuthentication: function (user, password) {
        scope.post('/authentication/sign_in', body => {
          if (user) { assert.strictEqual(body.user, user) }
          if (password) { assert.strictEqual(body.password, password) }
          return true
        })
          .delayConnection(serverDelay)
          .reply(200, '', { 'Set-Cookie': loginCookieName + '=' + authenticatedCookie })
        return this
      },
      withUnsuccessfulAuthentication: function () {
        scope.post('/authentication/sign_in')
          .delayConnection(serverDelay)
          .reply(401, '', { 'Set-Cookie': loginCookieName + '=' })
        return this
      },
      withUnsuccessfulGetRequest: function (uri, errorMessage) {
        scope.get(uri).delayConnection(serverDelay).replyWithError(errorMessage)
        return this
      },
      withUnsuccessfulDeleteRequest: function (uri, errorMessage) {
        scope.delete(uri).delayConnection(serverDelay).replyWithError(errorMessage)
        return this
      },
      withUnsuccessfulUpdateRequest: function (uri, errorMessage) {
        scope.put(uri).delayConnection(serverDelay).replyWithError(errorMessage)
        return this
      },
      withUnsuccessfulCreateRequest: function (uri, errormessage) {
        scope.post(uri).delayConnection(serverDelay).replyWithError(errormessage)
        return this
      },
      withGetRequest: function (uri, statusCode, replyData) {
        scope.get(uri).delayConnection(serverDelay).reply(statusCode, replyData)
        return this
      },
      withDeleteRequest: function (uri, statusCode) {
        scope.delete(uri).delayConnection(serverDelay).reply(statusCode)
        return this
      },
      withUpdateRequest: function (uri, statusCode, body, replyData) {
        scope.put(uri, body).delayConnection(serverDelay).reply(statusCode, replyData)
        return this
      },
      withCreateRequest: function (uri, statusCode, body, replyData) {
        scope.post(uri, body).delayConnection(serverDelay).reply(statusCode, replyData)
        return this
      },
      withUnauthorizedUpdateRequest: function (uri) {
        return this.withUpdateRequest(uri, 401)
      },
      withUnauthorizedGetRequest: function (uri) {
        return this.withGetRequest(uri, 401)
      },
      withUnauthorizedDeleteRequest: function (uri) {
        return this.withDeleteRequest(uri, 401)
      },
      withUnauthorizedCreateRequest: function (uri) {
        return this.withCreateRequest(uri, 401)
      },
      withSuccessfulSignOut: function () {
        scope.post('/authentication/sign_out')
          .delayConnection(serverDelay)
          .reply(200, '', { 'Set-Cookie': loginCookieName + '=' })
        return this
      },
      withUnsuccessfulSignOut: function () {
        scope.post('/authentication/sign_out')
          .delayConnection(serverDelay)
          .reply(401, '', { 'Set-Cookie': 'LWSSO_COOKIE_KEY=' })
        return this
      },
      build: function () {
        return scope
      }
    }
  }
})
