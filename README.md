# Node-Octane

A Node.js wrapper for the MF ALM Octane API.

## Installation

Install via npm

```bash
$ npm i hpe-alm-octane-js-rest-sdk
```

## Example

```javascript
var Octane = require('hpe-alm-octane-js-rest-sdk')

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

  // get all defects
  octane.defects.getAll({}, function (err, defects) {
    if (err) {
      console.log('Error - %s', err.message)
      return
    }

    console.log(defects.meta.total_count)
    defects.forEach(function (defect) {
      console.log(defect)
    })
  })

  // get 10 defects in places 10 – 19
  octane.defects.getAll({limit: 10, offset: 10}, function (err, defects) {
    console.log(defects)
  })

  // get low severity defects
  var q1 = Query.field('name').equal('Low')
  var q2 = Query.field('severity').equal(q1)
  octane.defects.getAll({query: q2}, function (err, defects) {
    console.log(defects)
  })

  // create a defect
  var defect = {
    name: 'defect',
    parent: aWorkItemRoot,
    severity: aSeverity,
    phase: aDefectPhase
  }
  octane.defects.create(defect, function (err, defect) {
    console.log(defect)
  })

  // get a defect
  octane.defects.get({id: 1001}, function (err, defect) {
    console.log(defect)
  })

  // delete a defect
  octane.defects.delete({id: 1001}, function (err) {
    if (err) {
      console.log('Error - %s', err.message)
      return
    }
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

## Query

The Octane REST API supports entities query by filtering values of fields. To filter, use a query statement, which is comprised of at least one query phase.

The client API provides the Query module to help you build the query, rather than writing the complex query statement.

```javascript
var Query = require('hpe-alm-octane-js-rest-sdk/query')

// query statement: "id EQ 1005"
var query = Query.field('id').equal(1005)
octane.defects.getAll({query: query}, function (err, defect) {
  console.log(defect)
})

...

// query statement: "name EQ ^test*^" 
var query = Query.field('name').equal('test*')

// query statement: "user_tags EQ {id EQ 1001}"
var query = Query.field('user_tags').equal(Query('id').equal(1001))

// query statement: "user_tags EQ {id EQ 1001||id EQ 2005}"
var query = Query.field('user_tags').equal(Query.field('id').equal(1001).or(Query.field('id').equal(2005)))
// or use the shorthand or() method
var query = Query.field('user_tags').equal(Query.field('id').equal(1001).or().field('id').equal(2005))

// query statement: "user_tags EQ {id EQ 1001;id EQ 3008}"
var query = Query.field('user_tags').equal(Query.field('id').equal(1001).and(Query.field('id').equal(3008)))
// or use the shorthand and() method
var query = Query.field('user_tags').equal(Query.field('id').equal(1001).and().field('id').equal(3008))

// query statement: "user_tags EQ {id EQ 1001};user_tags EQ {id EQ 3008}"
var query = Query.field('user_tags').equal(Query.field('id').equal(1001)).and(Query.field('user_tags').equal(Query.field('id').equal(3008)))
// or use the shorthand and() method
var query = Query.field('user_tags').equal(Query.field('id').equal(1001)).and().field('user_tags').equal(Query.field('id').equal(3008))
// or use the sub query
var query1 = Query.field('user_tags').equal(Query.field('id').equal(1001))
var query2 = Query.field('user_tags').equal(Query.field('id').equal(3008))

// query statement "id BTW 1..3" - notice that there are two parameters
var query = Query.field('id').between(1,2)

// query statement "id IN 1,2,3" - the parameter has to be an array
var query = Query.field('id').inComparison([1,2,3])

var query = query1.and(query2)
```

## Attachment

To create an attachment, you must provide the file's absolute path.

```javascript
...
var attachment = {
  name: 'attachment.txt',
  file: attachmentFile, // the file's absolute path
  owner_work_item: anWorkItem
}
octane.attachments.create(attachment, function (err, attachment) {
  console.log(attachment)
})
...
```

The attachment has both entity data and binary data. 
To get the attachment's entity data, call `attachments.get()`; to get its binary data, call `attachments.download()`.

```javascript
...
octane.attachments.get({id: attachmentID}, function (err, attachment) {
  consoloe.log(attachment)
})

octane.attachments.download({id: attachmentID}, function (err, data) {
  // data is the stream
  consoloe.log(data.toString())
})
...
```

## Update client API
The MF ALM Octane REST API is fully metadata-driven. When the Octane REST API is updated, you can update the client API from the metadata.

Create a configuration file (eg `octane.json`) file for updating client API. It defines the Octane server's configuration and user credentials.  Note that by default the tech preview API is *not* enabled.  To enable it
(especially when using attachments) use the `tech_preview_API` key as demonstrated below 

```bash
$ cat > octane.json << EOH
{
  "config": {
    "protocol": "http",
    "host": "<HOST>",
    "port": <PORT>,
    "shared_space_id": <SHARED_SPACE_ID>,
    "workspace_id": <WORKSPACE_ID>,
    "tech_preview_API": <boolean for whether tech preview api should be enabled>
  },
  "options": {
    "username": "<USERNAME>",
    "password": "<PASSWORD>"
  }
}
EOH
```
Send the path to the created configuration file to `generate_default_routes.js`

```
$ node scripts/generate_default_routes.js /path/to/octane.json
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

Run all tests

```bash
$ npm test
```

Or run a specific test

```bash
$ npm test test/query.js
```

The `octane.json` file is required for running the integration tests. If it doesn't exist, the integration tests will be skipped.
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

npm test test/integration
```

**Please Note**
When running integration tests and these include *attachments* the *tech preview api* needs to be enabled otherwise the attachments will fail

## Disclaimer
Certain versions of software accessible here may contain branding from Hewlett-Packard Company (now HP Inc.) and Hewlett Packard Enterprise Company.  As of September 1, 2017, the software is now offered by Micro Focus, a separately owned and operated company.  Any reference to the HP and Hewlett Packard Enterprise/HPE marks is historical in nature, and the HP and Hewlett Packard Enterprise/HPE marks are the property of their respective owners.
