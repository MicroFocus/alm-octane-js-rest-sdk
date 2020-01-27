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
    * [Query](#query)
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

```javascript
  //delete defect with id 1001
  await octane.delete(Octane.entityTypes.defects).at(1001).execute()

  //delete defects with their name equal to 'new defect'
  await octane.delete(Ocane.entityTypes.defects).query(Query.field('name').equal('new defect')).execute()
```

#### Create entities

```javascript
  // create the defect JSON which will be passed for defect creation
  let defect ={
    name: 'new defect',
    description: 'some description here',
    owner : {
      type: 'workspace_user',
      id: '1001'
    }
  }

  // send the create request
  octane.create(Octane.entityTypes.defects, defect).execute()
```

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

## Query

The Octane REST API supports entities query by filtering values of fields. To filter, use a query statement, which is 
comprised of at least one query phase.

The client API provides the Query module to help you build the query, rather than writing the complex query statement.

```javascript
const Query = require('@microfocus/alm-octane-js-rest-sdk/query')

// query statement: "id EQ 1005"
const query = Query.field('id').equal(1005)
octane.defects.getAll({query: query}, function (err, defect) {
  console.log(defect)
})

...

// query statement: "name EQ ^test*^"
const query = Query.field('name').equal('test*')

// query statement: "user_tags EQ {id EQ 1001}"
const query = Query.field('user_tags').equal(Query('id').equal(1001))

// query statement: "user_tags EQ {id EQ 1001||id EQ 2005}"
const query = Query.field('user_tags').equal(Query.field('id').equal(1001).or(Query.field('id').equal(2005)))
// or use the shorthand or() method
const query = Query.field('user_tags').equal(Query.field('id').equal(1001).or().field('id').equal(2005))

// query statement: "user_tags EQ {id EQ 1001;id EQ 3008}"
const query = Query.field('user_tags').equal(Query.field('id').equal(1001).and(Query.field('id').equal(3008)))
// or use the shorthand and() method
const query = Query.field('user_tags').equal(Query.field('id').equal(1001).and().field('id').equal(3008))

// query statement: "user_tags EQ {id EQ 1001};user_tags EQ {id EQ 3008}"
const query = Query.field('user_tags').equal(Query.field('id').equal(1001)).and(Query.field('user_tags').equal(Query.field('id').equal(3008)))
// or use the shorthand and() method
const query = Query.field('user_tags').equal(Query.field('id').equal(1001)).and().field('user_tags').equal(Query.field('id').equal(3008))
// or use the sub query
const query1 = Query.field('user_tags').equal(Query.field('id').equal(1001))
const query2 = Query.field('user_tags').equal(Query.field('id').equal(3008))

// query statement "id BTW 1..3" - notice that there are two parameters
const query = Query.field('id').between(1,2)

// query statement "id IN 1,2,3" - the parameter has to be an array
const query = Query.field('id').inComparison([1,2,3])

const query = query1.and(query2)

// for null use either Query.NULL for non-reference fields or Query.NULL_REFERENCE for references (Query.NONE still exists for backwards-compatibility
// and is the same as Query.NULL_REFERENCE)
const query1 = Query.field('string_field').equal(Query.NULL)
const query2 = Query.field('reference_field').equal(Query.NULL_REFERENCE)
```

## Tests



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