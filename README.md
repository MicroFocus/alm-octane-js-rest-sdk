# Node-Octane

A Node.js wrapper for the MF ALM Octane API.

##Table of contents
1. [Installation](#installation)
1. [Introduction](#introduction)
1. [Octane object](#octane-object)
    * [Import](#import)
    * [Parameters](#octane(params))
    * [Methods](#methods)
1. [Usage examples](#usage-examples)
    * [Get entities](#get-entities)
    * [Delete entities](#delete-entities)
    * [Create entities](#create-entities)
    * [Update entities](#update-entities)
1. [Tests](#tests)
1. [Disclaimer](#disclaimer)
1. [What's new](#what's-new-:newspaper:)

## Installation

Install via npm

```bash
$ npm i @microfocus/alm-octane-js-rest-sdk
```

## Introduction

This SDK contains two use cases: the generic one which can be used out of the box, namely the Octane object, 
and also the OctaneVanilla object which needs the default.json generated file. 

The recommended way to use this SDK is to use the Octane object as the OctaneVanilla version is error-prone due
to the fact that it needs regeneration every time the API changes or fields are added. 

The docs for the original version of the SDK can be found [here](/lib/generate-routes/README.md).

## Octane object
The following sections expose the functionality of the generic version of the SDK. 

#### Import

```javascript
const Octane = require('@microfocus/alm-octane-js-rest-sdk').Octane
```

#### Octane(params)

Params can have the following members:

Mandatory parameters:

- ```server``` - The alm Octane server URL.

- ```sharedSpace``` - The ALM Octane shared space id.

- ```workspace``` - The ALM Octane workspace id. 

- ```user``` - Can be either an existing user's email or an existing API Access key. 

- ```password``` - Can be either an existing user's password or an existing API Access secret.

Optional parameters:

- ```proxy``` - A proxy URL. 

- ```headers``` - A JSON with header keys and values.

Example:

```javascript
const octane = new Octane({
  server: 'https://myOctane:8080',
  sharedSpace: 1001,
  workspace: 1002,
  user: 'myUser@user.domain',
  password: 'Password123',
  headers: {
    ALM_OCTANE_TECH_PREVIEW: true
  },
  proxy: 'http://myProxy:8080'
})
```

#### Methods
The methods below will not affect directly the Octane data but adding properties for the final URL which will be used
for the actual request. Moreover, these methods can be chained
- ```get(entityName) & delete(entityName)``` - Set the entity name and the request method (GET/DELETE) 
for the future request. 
- ```create(entityName, body) & update(entityName, body) & updateBulk(entityName, body)``` - 
Set the entity name, the body and the request method(POST/PUT) for the future request.
- ```at(id)``` - The request will be performed at entity level, affecting only the entity with the specific id. The URL
for the request will be similar to this one *.../defects/1001*
- ```limit(limit)``` - When getting multiple entities, Octane allows users to set a limit of entities 
to fetch. If only limit is set, the first page with a number of *limit* entities will be fetched. ***Note***: 
*ALM Octane has a default limit for entity fetching.*
- ```offset(offset)``` - Set the number of page that will be fetched. (ex: if limit is set to 200 and there 
are 900 entities, the offset can be set to 3 resulting      in fetching the entities in the  401-600 range) ***Note***:
*The order of the entities can change*
- ```orderBy(...fieldNames)``` - The entities will be ordered by the field names passed here. If an ascending order is needed,
the fields can be simply passed by strings and separated by a comma. However, the order can be set to descending by passing
the fields with a minus. Example: ```'-id'``` - the entities will be fetched sorted descending by the *id* field. 
- ```fields(...fieldNames)``` - These fields will be passed in the *fields* query parameter in the URL. This can be useful,
 for example, when fetching entities to request the fields needed *i.e. name, description* or any other field. 
- ```query(query)``` - Any query can be passed in order to filter the entities. The  query can be built using the 
```Query``` class available in the SDK.
- ```script()``` - *This is specific for tests and cannot be used for aot.* The request URL will look similar to this: *.../tests/1001/scripts*.
This will result (after the request is executed) in fetching the test's script.

These methods are sending actual requests:
- ```execute()``` - Fires the request after building the request URL.
- ```signOut()``` - A sign out request is sent to ALM Octane. 

#### Octane.entityTypes

The Octane.entityTypes JSON contains all the entities present in the public API of ALM Octane. This can be used in order
to access Octane entities.

## Usage examples

#### Get entities
```javascript
  const octane = new Octane(...)

  // get all defects
  const allDefects = await octane.get(Octane.entityTypes.defects).execute()

  // get defect with id 1001
  const defect = await octane.get(Octane.entityTypes.defects).at(1001).execute()

  // get defects ordered by name and containing the owner field
  const richDefect = await octane.get(Octane.entityTypes.defects).fields('name', 'owner').order_by('name').execute()

  // get defects with with ids in the 1001-1050 range
  const queryDefect = await octane.get(Octane.entityTypes.defects).query(Query.field('id').between(1001, 1050).build()).execute()
  
  // get the script of the test with id 1001
  const testScript = await octane.get(Octane.entityTypes.tests).at(1001).script().execute()
```

#### Delete entities

#### Create entities

#### Update entities

```javascript
  // get the defect which needs to be modified
  let defect = await octane.get(Octane.entityTypes.defects).at(1001).fields('name', 'description').execute()

  // change some fields
  defect.name = 'newName'
  defect.description = 'newDescription'

  // send an update request
  octane.update(Octane.entityTypes.defects, defect).execute()
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


## What's new :newspaper:
* 15.0.20
    * Old functionality is implemented in the `OctaneVanilla` class
    * The documentation for `OctaneVanilla` functionality can be found [here](/lib/generate-routes/README.md)
    * The OctaneVanilla code has moved from ES5 to ES6
    * A generic way to interact with the ALM Octane API has been implemented as `Octane` class

## Disclaimer
Certain versions of software accessible here may contain branding from Hewlett-Packard Company (now HP Inc.) and 
Hewlett Packard Enterprise Company.  As of September 1, 2017, the software is now offered by Micro Focus, a separately 
owned and operated company. Any reference to the HP and Hewlett Packard Enterprise/HPE marks is historical in nature, 
and the HP and Hewlett Packard Enterprise/HPE marks are the property of their respective owners.