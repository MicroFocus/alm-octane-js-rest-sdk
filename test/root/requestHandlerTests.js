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
const MockAdapter = require('axios-mock-adapter')
const RequestHandler = require('../../lib/root/requestHandler')
const testServerUrl = ''
const uri = '/some/uri'
const user = 'MyUser'
const password = 'MyPassword'

const UNAUTHORIZED_ERROR = {
  name: 'Error',
  response: {
    status: 401
  }
}

describe('requestHandler', function () {
  this.slow(350)
  let requestHandler
  beforeEach(() => {
    const requestHandlerInitialization = { user: user, password: password, server: testServerUrl }
    requestHandler = new RequestHandler(requestHandlerInitialization)
  })

  async function throwsUnauthorizedException (promise) {
    await throwsException(promise, 401, undefined)
  }

  async function throwsException (promise, statusCode, errorBody) {
    try {
      await promise
      assert.fail()
    } catch (e) {
      if (errorBody) {
        assert.strictEqual(JSON.stringify(e.response.data), JSON.stringify(errorBody))
      }
      if (statusCode) {
        assert.strictEqual(e.response.status, statusCode)
      }
    }
  }

  describe('#authenticate', () => {
    it('makes a successful authentication request with the given username and password', async () => {
      const scope = new BuildServerResponses(requestHandler._requestor)
        .withSuccessfulAuthentication(user, password)
        .build()
      const shouldBeUndefined = await requestHandler.authenticate()
      await assert.strictEqual(shouldBeUndefined.data, undefined)
      scope.reset()
    })
    it('throws an error after failed authentication', async () => {
      const scope = new BuildServerResponses(requestHandler._requestor)
        .withUnsuccessfulAuthentication()
        .build()
      await throwsUnauthorizedException(requestHandler.authenticate())
      scope.reset()
    })
  })

  describe('#get', () => {
    it('throws an error in case of an error response different from 401', async () => {
      const error = { error: 'Failed as intended' }
      const scope = new BuildServerResponses(requestHandler._requestor)
        .withUnsuccessfulGetRequest(uri, error)
        .build()
      await throwsException(requestHandler.get(uri), 400, error)
      scope.reset()
    })
    it('throws an error if request was answered with status code 401 two times', async () => {
      const scope = new BuildServerResponses(requestHandler._requestor)
        .withUnauthorizedGetRequest(uri)
        .withSuccessfulAuthentication()
        .withUnauthorizedGetRequest(uri)
        .build()
      await throwsUnauthorizedException(requestHandler.get(uri))
      scope.reset()
    })
    it('throws an error if request was answered with status code 401 and authentication fails', async () => {
      const scope = new BuildServerResponses(requestHandler._requestor)
        .withUnauthorizedGetRequest(uri)
        .withUnsuccessfulAuthentication()
        .build()
      await throwsUnauthorizedException(requestHandler.get(uri))
      scope.reset()
    })
    it('returns the data even if the 1st request was with the status code 401', async function () {
      const objectToGet = 'Request was successful'
      const scope = new BuildServerResponses(requestHandler._requestor)
        .withUnauthorizedGetRequest(uri)
        .withSuccessfulAuthentication()
        .withGetRequest(uri, 200, objectToGet)
        .build()
      const objectGot = await requestHandler.get(uri)
      assert.strictEqual(objectGot.data, objectToGet)
      scope.reset()
    })
    it('makes a successful get request', async function () {
      const objectToGet = 'Request was successful'
      const scope = new BuildServerResponses(requestHandler._requestor)
        .withGetRequest(uri, 200, objectToGet)
        .build()
      const objectGot = await requestHandler.get(uri)
      assert.strictEqual(objectGot.data, objectToGet)
      scope.reset()
    })
  })

  describe('#delete', () => {
    it('throws an error in case of an error response different from 401', async () => {
      const error = { error: 'Failed as intended' }
      const scope = new BuildServerResponses(requestHandler._requestor)
        .withUnsuccessfulDeleteRequest(uri, error)
        .build()
      await throwsException(requestHandler.delete(uri), 400, error)
      scope.reset()
    })
    it('throws an error if request was answered with status code 401 two times', async function () {
      const scope = new BuildServerResponses(requestHandler._requestor)
        .withUnauthorizedDeleteRequest(uri)
        .withSuccessfulAuthentication()
        .withUnauthorizedDeleteRequest(uri)
        .build()
      await throwsUnauthorizedException(requestHandler.delete(uri))
      scope.reset()
    })
    it('throws an error if request was answered with status code 401 and authentication fails', async () => {
      const scope = new BuildServerResponses(requestHandler._requestor)
        .withUnauthorizedDeleteRequest(uri)
        .withUnsuccessfulAuthentication()
        .build()
      await throwsUnauthorizedException(requestHandler.delete(uri))
      scope.reset()
    })
    it('request is made even if 1st request was with the status code 401', async function () {
      const scope = new BuildServerResponses(requestHandler._requestor)
        .withUnauthorizedDeleteRequest(uri)
        .withSuccessfulAuthentication()
        .withDeleteRequest(uri, 200)
        .build()
      const shouldBeUndefined = await requestHandler.delete(uri)
      assert.strictEqual(shouldBeUndefined.data, undefined)
      scope.reset()
    })
    it('makes a successful delete request', async function () {
      const scope = new BuildServerResponses(requestHandler._requestor)
        .withDeleteRequest(uri, 200)
        .build()
      const shouldBeUndefined = await requestHandler.delete(uri)
      assert.strictEqual(shouldBeUndefined.data, undefined)
      scope.reset()
    })
  })

  describe('#update', () => {
    it('throws an error in case of an error response different from 401', async () => {
      const error = { error: 'Failed as intended' }
      const scope = new BuildServerResponses(requestHandler._requestor)
        .withUnsuccessfulUpdateRequest(uri, error)
        .build()
      await throwsException(requestHandler.update(uri), 400, error)
      scope.reset()
    })
    it('throws an error if request was answered with status code 401 two times', async function () {
      const scope = new BuildServerResponses(requestHandler._requestor)
        .withUnauthorizedUpdateRequest(uri)
        .withSuccessfulAuthentication()
        .withUnauthorizedUpdateRequest(uri)
        .build()
      await throwsUnauthorizedException(requestHandler.update(uri))
      scope.reset()
    })
    it('throws an error if request was answered with status code 401 and authentication fails', async () => {
      const scope = new BuildServerResponses(requestHandler._requestor)
        .withUnauthorizedUpdateRequest(uri)
        .withUnsuccessfulAuthentication()
        .build()
      await throwsUnauthorizedException(requestHandler.update(uri))
      scope.reset()
    })
    it('request is made even if 1st request was with the status code 401', async function () {
      const updatedObject = 'Success'
      const updateBody = {
        parameter1: 'para 1',
        parameter2: 2
      }
      const scope = new BuildServerResponses(requestHandler._requestor)
        .withUnauthorizedUpdateRequest(uri, updateBody, updatedObject)
        .withSuccessfulAuthentication()
        .withUpdateRequest(uri, 200, updateBody, updatedObject)
        .build()

      const responseObject = await requestHandler.update(uri, updateBody)
      assert.strictEqual(responseObject.data, updatedObject)

      scope.reset()
    })
    it('makes a successful update request', async function () {
      const updatedObject = 'Success'
      const updateBody = {
        parameter1: 'para 1',
        parameter2: 2
      }
      const scope = new BuildServerResponses(requestHandler._requestor)
        .withUpdateRequest(uri, 200, updateBody, updatedObject)
        .build()
      const responseObject = await requestHandler.update(uri, updateBody)
      assert.strictEqual(responseObject.data, updatedObject)
      scope.reset()
    })
  })

  describe('#create', () => {
    it('throws an error in case of an error response different from 401', async () => {
      const error = { error: 'Failed as intended' }
      const scope = new BuildServerResponses(requestHandler._requestor)
        .withUnsuccessfulCreateRequest(uri, error)
        .build()
      await throwsException(requestHandler.create(uri), 400, error)
      scope.reset()
    })
    it('throws an error if request was answered with status code 401 two times', async function () {
      const scope = new BuildServerResponses(requestHandler._requestor)
        .withUnauthorizedCreateRequest(uri)
        .withSuccessfulAuthentication()
        .withUnauthorizedCreateRequest(uri)
        .build()
      await throwsUnauthorizedException(requestHandler.create(uri))
      scope.reset()
    })
    it('throws an error if request was answered with status code 401 and authentication fails', async () => {
      const scope = new BuildServerResponses(requestHandler._requestor)
        .withUnauthorizedCreateRequest(uri)
        .withUnsuccessfulAuthentication()
        .build()
      await throwsUnauthorizedException(requestHandler.create(uri))
      scope.reset()
    })
    it('request is made even if 1st request was with the status code 401', async function () {
      const createObject = 'Success'
      const createBody = {
        parameter1: 'para 1',
        parameter2: 2
      }
      const scope = new BuildServerResponses(requestHandler._requestor)
        .withUnauthorizedCreateRequest(uri, createBody, createObject)
        .withSuccessfulAuthentication()
        .withCreateRequest(uri, 200, createBody, createObject)
        .build()
      const responseObject = await requestHandler.create(uri, createBody)
      assert.strictEqual(responseObject.data, createObject)
      scope.reset()
    })
    it('makes a successful update request', async function () {
      const createObject = { data: 'Success' }
      const createBody = {
        parameter1: 'para 1',
        parameter2: 2
      }
      const scope = new BuildServerResponses(requestHandler._requestor)
        .withCreateRequest(uri, 200, createBody, createObject)
        .build()
      const responseObject = await requestHandler.create(uri, createBody)
      assert.strictEqual(JSON.stringify(responseObject.data), JSON.stringify(createObject))
      scope.reset()
    })
  })

  describe('#reauthenicate', () => {
    it('throws the error given if it does not have the status code 401', async () => {
      const scope = new BuildServerResponses(requestHandler._requestor).withUnsuccessfulAuthentication().build()
      const errorWithoutStatusCode = { response: { data: 'Error' } }
      const errorWithStatusCode = { response: { status: 400, data: 'Error' } }
      await throwsException(requestHandler._reauthenticate(errorWithoutStatusCode), undefined, errorWithoutStatusCode.response.data)
      await throwsException(requestHandler._reauthenticate(errorWithStatusCode), 400, errorWithStatusCode.response.data)
      scope.reset()
    })
    it('throws an error if the error received has status code 401 and the authentication fails ', async function () {
      const scope = new BuildServerResponses(requestHandler._requestor).withUnsuccessfulAuthentication().build()
      await throwsUnauthorizedException(requestHandler._reauthenticate(UNAUTHORIZED_ERROR))
      scope.reset()
    })
    it('authenticates again if the received error has the status code 401', async function () {
      const scope = new BuildServerResponses(requestHandler._requestor).withSuccessfulAuthentication().build()
      const shouldBeUndefined = await requestHandler._reauthenticate(UNAUTHORIZED_ERROR)
      assert.strictEqual(shouldBeUndefined.data, undefined)
      scope.reset()
    })
  })

  describe('#signOut', () => {
    it('throws an error if the request fails', async function () {
      const scope = new BuildServerResponses(requestHandler._requestor)
        .withUnsuccessfulSignOut()
        .build()
      await throwsUnauthorizedException(requestHandler.signOut())
      scope.reset()
    })
    it('throws an error if the request fails', async function () {
      const scope = new BuildServerResponses(requestHandler._requestor)
        .withSuccessfulSignOut()
        .build()
      const shouldBeUndefined = await requestHandler.signOut()
      assert.strictEqual(shouldBeUndefined.data, undefined)
      scope.reset()
    })
  })

  class BuildServerResponses {

    constructor (requester) {
      this.scope = new MockAdapter(requester)
      this.authenticatedCookie = 'Authenticated'
      this.loginCookieName = 'LWSSO_COOKIE_KEY'
    }

    withSuccessfulAuthentication (user, password) {
      this.scope.onPost('/authentication/sign_in', {
        asymmetricMatch (actual) {
          if (user) { assert.strictEqual(actual.user, user) }
          if (password) { assert.strictEqual(actual.password, password) }
          return true
        }
      }).reply(200, undefined, { 'Set-Cookie': this.loginCookieName + '=' + this.authenticatedCookie })
      return this
    }

    withUnsuccessfulAuthentication () {
      this.scope.onPost('/authentication/sign_in').reply(401, undefined, { 'Set-Cookie': this.loginCookieName + '=' })
      return this
    }

    withUnsuccessfulGetRequest (uri, errorBody) {
      this.scope.onGet(uri).reply(400, errorBody)
      return this
    }

    withUnsuccessfulDeleteRequest (uri, errorBody) {
      this.scope.onDelete(uri).reply(400, errorBody)
      return this
    }

    withUnsuccessfulUpdateRequest (uri, errorBody) {
      this.scope.onPut(uri).reply(400, errorBody)
      return this
    }

    withUnsuccessfulCreateRequest (uri, errorBody) {
      this.scope.onPost(uri).reply(400, errorBody)
      return this
    }

    withGetRequest (uri, statusCode, replyData) {
      this.scope.onGet(uri).reply(statusCode, replyData)
      return this
    }

    withDeleteRequest (uri, statusCode) {
      this.scope.onDelete(uri).reply(statusCode)
      return this
    }

    withUpdateRequest (uri, statusCode, body, replyData) {
      this.scope.onPut(uri, body).reply(statusCode, replyData)
      return this
    }

    withCreateRequest (uri, statusCode, body, replyData) {
      this.scope.onPost(uri, body).reply(statusCode, replyData)
      return this
    }

    withUnauthorizedUpdateRequest (uri, body, replyData) {
      return this.withUpdateRequest(uri, 401, body, replyData)
    }

    withUnauthorizedGetRequest (uri) {
      return this.withGetRequest(uri, 401)
    }

    withUnauthorizedDeleteRequest (uri) {
      return this.withDeleteRequest(uri, 401)
    }

    withUnauthorizedCreateRequest (uri, body, replyData) {
      return this.withCreateRequest(uri, 401, body, replyData)
    }

    withSuccessfulSignOut () {
      this.scope.onPost('/authentication/sign_out')
        .reply(200, undefined, { 'Set-Cookie': this.loginCookieName + '=' })
      return this
    }

    withUnsuccessfulSignOut () {
      this.scope.onPost('/authentication/sign_out')
        .reply(401, undefined, { 'Set-Cookie': 'LWSSO_COOKIE_KEY=' })
      return this
    }

    build () {
      return this.scope
    }
  }
})
