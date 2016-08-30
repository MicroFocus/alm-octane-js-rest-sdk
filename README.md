# Node-Octane

A Node.js wrapper for the HPE ALM Octane API.

## Installation

Install via git clone

```bash
$ git clone https://github.hpe.com/da-sheng-jian/node-octane.git
$ cd node-octane
$ npm install
```

## Example

Get all defects:
```javascript
var Octane = require("octane");

var octane = new Octane({
  protocol: "https",
  host: <HOST>,
  port: <PORT>,
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

  otcane.defects.getAll(function (err, defects) {
    if (err) {
      console.log('Error - %s', err.message)
      return
    }

    console.log(defects)
  })
})
```

## Authentication

The Octane API allows to sign in with user credential or API key.

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

## Documentation
Client API: 

## Update client API
The HPE ALM Octane REST API is fully metadata-driven. When the Octane REST API is updated, you can update the client API from the metadata.

Create `octane.json` file for updating client API. It defines the Octane server's configuration and user credential.

```bash
$ cat > octane.json << EOH
{
  "config": {
    "protocol": "http",
    "host": "<HOST>",
    "port": <PORT>,
    "shared_space_id": <SHARED_SPACE_ID>,
    "workspace_id": <WORKSPACE_ID>
  },
  "options": {
    "username": "<USERNAME>",
    "password": "<PASSWORD>"
  }
}
EOH

$ node scripts/generate_default_routes.js
```

> The client API is defined in `routes/default.json` file. When you run this script to update the client API, you actually update the `routes/default.json` file.

> The `routes/meta.json` file defines the minimal client API. It can't be changed or deleted.

## Update client API documentation

When the `routes/default.json` file is updated, you'll want to update API annotation file:

```bash
$ mkdir -p doc
$ node scripts/generate_api_annotations.js
```

Then you can create the client API documentation:

```bash
$ npm install apidoc
$ node_modules/.bin/apidoc -f doc/apidoc.js -o apidoc/
```

## Tests
Create `octane.json` file for running tests. It defines the Octane server's configuration and user credential.

```bash
$ cat > octane.json << EOH
{
  "config": {
    "protocol": "http",
    "host": "<HOST>",
    "port": <PORT>,
    "shared_space_id": <SHARED_SPACE_ID>,
    "workspace_id": <WORKSPACE_ID>
  },
  "options": {
    "username": "<USERNAME>",
    "password": "<PASSWORD>"
  }
}
EOH
```

Run all tests

```bash
$ npm test
```

Or run a specific test

```bash
$ npm test test/octane/defects.js
```

## LICENSE

GNU GPLv3 license.
