# Node-Octane

A Node.js wrapper for the HPE ALM Octane API.

## Installation

Install via [npm](https://www.npmjs.com/package/github)

```bash
$ npm install github
```

or

Install via git clone

```bash
$ git clone https://github.com/mikedeboer/node-github.git
$ cd node-github
$ npm install
```

## Example

Get all work items:
```javascript
var Octane = require("octane");

var octane = new Octane({
  protocol: "https",
  host: <HOST>,
  shared_space_id: <SHARED_SPACE_ID>,
  workspace_id: <WORKSPACE_ID>
})

octane.authenticate({
  username: <USERNAME>,
  password: <PASSWORD>
}, function (err) {
  if (err) {
    console.log('Error - %s', err.message)
    return
  }

  otcane.workItems.getAll(function (err, workItems) {
    if (err) {
      console.log('Error - %s', err.message)
      return
    }

    console.log(workItems)
  })
})
```

## Authentication

The Octane API allows to sign in with user credentail or API key.

```javascript
// user credential
octane.authenticate({
  username: <USERNAME>,
  password: <PASSWORD>
}, function (err) {
  // handle sign in result
})

// API key
octane.authenticate({
  client_id: <CLIENT_ID>,
  client_secret: <CLIENT_SECRET>
}, function (err) {
  // handle sign in result
})
```

## Update docs

When updating routes.json, you'll want to update/generate docs:

```bash
$ node bin/generate.js
```

Dev note for updating apidoc for github pages:

```bash
$ npm install apidoc
$ node_modules/.bin/apidoc -f doc/apidoc.js -o apidoc/
```

## Test auth file

Create test auth file for running tests.

```bash
$ > testAuth.json
{
	"config": {
		"protocol": "https",
		"host": "<HOST>",
		"shared_space_id": <SHARED_SPACE_ID>,
		"workspace_id": <WORKSPACE_ID>
	},
	"options": {
		"username": "<USERNAME>",
		"password": "<PASSWORD>"
	}
}
```

## Tests

Run all tests

```bash
$ npm test
```

Or run a specific test

```bash
$ npm test test/octane/entities.js
```

## LICENSE

GNU GPLv3 license.
