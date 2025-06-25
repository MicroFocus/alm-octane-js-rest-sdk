# OpenText Core Software Delivery Platform Node REST API

A Node.js wrapper for the Open Text Core Software Delivery Platform (SDP) and Software Delivery Management REST API.

## Table of contents
1. [Installation](#installation)
1. [Introduction](#introduction)
1. [Octane object](#octane-object)
    * [Import](#import)
    * [Parameters](#octane-params)
    * [Methods](#methods)
        * [create](#create)
        * [get](#get)
        * [update](#update)
        * [updateBulk](#updateBulk)
        * [delete](#delete)
        * [getAttachmentContent](#getAttachmentContent)
        * [uploadAttachment](#uploadAttachment)
        * [executeCustomRequest](#executeCustomRequest)
        * [authenticate](#authenticate)
        * [signOut](#signOut)
    * [Octane.entityTypes](#octane-entity-types)
    * [Octane.operationTypes](#octane-operation-types)
1. [Usage examples](#usage-examples)
    * [Get metadata](#get-metadata)
    * [Get entities](#get-entities)
    * [Delete entities](#delete-entities)
    * [Create entities](#create-entities)
    * [Update entities](#update-entities)
    * [Attachments](#attachments)
    * [Query](#query)
1. [Tests](#tests)
1. [What's new](#whats-new)
1. [Disclaimer](#disclaimer)

## Installation

Install via npm

```bash
$ npm i @microfocus/alm-octane-js-rest-sdk
```

## Octane object

The `Octane` object is used to connect to the SDP or SDM REST API.
This SDK is designed to work seamlessly with either Open Text Core Software Delivery Platform (SDP) and Software Delivery Management. For simplicity, these products will be referred to as SDP in the sections below. Both namings reference the ALM Octane previous naming of the product.

#### Import

```javascript
import { Octane } from '@microfocus/alm-octane-js-rest-sdk';

```

#### Octane(params) <a name="octane-params"></a>

Params can have the following members:

Mandatory parameters:

- ```server``` - The SDP server URL.

- ```sharedSpace``` - The SDP shared space id.

- ```workspace``` - The SDP workspace id. 

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

The method which actually fires a request is the `execute()` method. This means, only when the `execute()` method is called, the SDP data can be affected or retrieved. The other methods are used solely to set up the request. Please see the [examples](#usage-examples) for a better understanding.

Besides `execute()`, the `signOut()` can be used to send a sign out request to SDP. 

The rest of the methods will not affect directly the SDP data, but add properties to the final URL which will be used for the actual request. Moreover, some of the methods can be chained.

- ```create(entityName, body)``` <a name="create"></a>
    
    *Parameters* : 
    - **entityName** - Contains the name of the affected SDP entity. The recommended way to use the entity names is to use the [Octane.entityTypes](#octane-entity-types) entries. 
    - **body** - A JSON containing *field name* and *field value* pairs which will be used to crate the entity. Field names can be obtained by querying the field metadata of SDP. More information about the SDP field metadata can be found [here](https://admhelp.microfocus.com/octane/en/latest/Online/Content/API/MetadataFields.htm). Examples on how to retrieve metadata using the SDK can be found [here](#get-metadata).
        
    *Behavior*:
    
    This method does not fire the request but builds up to the final URL and defines the request method.
    
    The method will set the next request to take action on the entity type defined by *entityName*. When the request will be executed, the created entities will have the type provided by *entityName* and the attributes defined in the *body* JSON.
    
    *Methods which can be chained*:
    
    The only chaining allowed is with the `execute()` method, resulting in firing a request to SDP and thus creating the entity defined in the *body* JSON.
    
         
- ```get(entityName)``` <a name="get"></a>

    *Parameters* : 
    - **entityName** - Contains the name of the SDP entity which will be fetched. The recommended way to use the entity names is to use the [Octane.entityTypes](#octane-entity-types) entries. 
    
    *Behavior*
   
   This method does not fire the request but builds up to the final request URL and defines the request method. When the get request will be executed, the returned entities will have the type provided by entityName.
   
   *Methods which can be chained*
   - `execute()` - Will fire the request to create all the defined entities.
   - `at(id)` - Defines which entity will be targeted for the next request. The input for this method is the id of the targeted entity.
   - `fields(fields)` - The fields parameter represents an array with names of fields relevant for the entity which will be affected by the request. When the request will be fired, the entities affected will contain the listed fields. Please inspect the field metadata before passing field names to this method.
   - `orderBy(fields)` - The fields parameter represent an array with names of fields which is relevant for the order in which the entities will be processed. Adding a '-' at the beginning of any field name will fetch the entities in a descending order (ex: [id, '-name']). Please inspect the field metadata before passing field names to this method.
   - `query(query)` - Defines an SDP-specific filter. When the request will be executed, only the entities filtered by the query will be gathered.
   - `limit(limit)` - When a query returns a large set of data, the results are returned in a series of pages. There is a default limit set for the entities fetched in a page. However, the user can set a custom limit by providing an integer greater that 0.
   - `offset(offset)` - When a query returns a large set of data, the results are returned in a series of pages. There is a default limit set for the entities fetched in a page. Based on that limit, multiple pages are formed. To select the desired range of entities, the offset must be provided as a number which sets the index of the entity which will be fetched first. If the offset is not provided, 0 is used instead.
    
- ```update(entityName, body)``` <a name="update"></a>
     
    *Parameters* : 
    - **entityName** - Contains the name of the affected SDP entity. The recommended way to use the entity names is to use the [Octane.entityTypes](#octane-entity-types) entries. 
    - **body** - A JSON containing *field name* and *field value* pairs which will be used to update the entity. Field names can be obtained by querying the field metadata of SDP. More information about the SDP field metadata can be found [here](https://admhelp.microfocus.com/octane/en/latest/Online/Content/API/MetadataFields.htm). Examples on how to retrieve metadata using the SDK can be found [here](#get-metadata).
        
    *Behavior*:
    
    This method does not fire the request but builds up to the final URL and defines the request method. When the request will be executed, the updated entity will have the type provided by entityName and the attributes defined in the body JSON.
    > This method affects a single entity. To target an entity for update the id must be provided and this can be done in the following two ways:
    > - provide the id in the body JSON
    > - provide the at(id) method, available in this class, with the desired id. The at(id) method can be chained to update method.
    
    *Methods which can be chained*
     - `execute()` - Will fire the request to update the entity for the built query.
     - `at(id)` - Defines which entity will be targeted for the next request. The input for this method is the id of the targeted entity. If this is chained to the `update` method, the id field in the body of the JSON is not mandatory.
    
- ```updateBulk(entityName, body)``` <a name="updateBulk"></a>
     
    *Parameters* : 
     - **entityName** - Contains the name of the affected SDP entity. The recommended way to use the entity names is to use the [Octane.entityTypes](#octane-entity-types) entries. 
     - **body** - A JSON containing *field name* and *field value* pairs which will be used to update the entity. Field names can be obtained by querying the field metadata of SDP. More information about the SDP field metadata can be found [here](https://admhelp.microfocus.com/octane/en/latest/Online/Content/API/MetadataFields.htm). Examples on how to retrieve metadata using the SDK can be found [here](#get-metadata).
    
    *Behavior*:
    
    This method does not fire the request but builds up to the final URL and defines the request method. When the request will be executed, the updated entities will have the type provided by entityName and the attributes defined in the body JSON. Every entity in the body JSON must have an existing id to target existing entities in SDP. This method affects multiple entities.
    
    *Methods which can be chained*
    - `execute()` - Will fire the request to update all the entities for the built query.
    - `query(query)` - Defines an SDP-specific filter. When the request will be executed, only the entities filtered by the query will be affected. In this case the body of the request does not have to contain ids for the entities.
     
- ```delete(entityName)``` <a name="delete"></a>
    
    *Parameters* : 
    - **entityName** - Contains the name of the SDP entity which will be fetched. The recommended way to use the entity names is to use the [Octane.entityTypes](#octane-entity-types) entries. 
        
    *Behavior*
       
    This method does not fire the request but builds up to the final request URL and defines the request method. When the delete request will be executed, all the selected entities will be deleted.
    > This method must be chained with `query()` or `at()`, which are described below.
    
   *Methods which can be chained*
   - `execute()` - Will fire the request to delete all the entities which were selected using a query or an id.
   - `at(id)` - Defines which entity will be targeted for the next request. The input for this method is the id of the targeted entity.
   - `query(query)` - Defines an SDP-specific filter. When the request will be executed, only the entities filtered by the query will be deleted.

- ```getAttachmentContent()``` <a name="getAttachmentContent"></a>
    
    *Behavior*
    
    This method does not fire the request but builds up to the final request URL and defines the request method. When the get request will be executed it will return the attachment content. Information about requests which involve attachments can be found [here](https://admhelp.microfocus.com/octane/en/latest/Online/Content/API/Attachments_HowTo.htm)
    
    > This method must be chained with `at()` to fetch the correct data.  
                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         
    *Methods which can be chained*
     - `execute()` - Will fire the request to get the content of the attachment which was selected using an id.
     - `at(id)` - Defines which entity will be targeted for the next request. The input for this method is the id of the targeted entity.

- ```uploadAttachment(attachmentName, attachmentData, ownerName, ownerReference)``` <a name="uploadAttachment"></a>
    
    *Parameters*
    - **attachmentName** - The name which will be used for attachment creation.
    - **attachmentData** - The content of the attachment which will be uploaded later.
    - **ownerName** - The name of the entity where the attachment will be uploaded, like "owner_release". The possible owner fields can be found in the field metadata of attachments.
     - **ownerReference** - The reference of the entity where the attachment will be uploaded. This can be an id of entity, or a JSON with the type and id of the entity.
    
    *Behavior*
    
    This method does not fire the request but builds up to the final URL and defines the request method.
    
    When the request will be executed, the created attachment will have the name provided by attachmentName, the content defined by attachmentData and it will be under the entity provided by ownerName and ownerReference.  Information about requests which involve attachments can be found [here](https://admhelp.microfocus.com/octane/en/latest/Online/Content/API/Attachments_HowTo.htm)
       
    *Methods which can be chained*
     - `execute()` - Will fire the request to create the attachment defined by attachmentData and it will be under the entity provided by ownerName and ownerReference.

- ```executeCustomRequest (customUrl, operation, body, headers)``` <a name="executeCustomRequest"></a>

  *Parameters*
    - **customUrl** - The url to which the request will be sent to. The URL should exclude the server and point to the desired resource.
    - **operation** - The type of operation that will be executed by the requester. The recommended way to use the entity names is to use the [Octane.operationTypes](#octane-operation-types) entries.
    - **body** - The body of the custom request. This is an optional parameter and it will default to undefined.
    - **headers** - Custom headers object. This must be a JSON where the key: value pairs represent the headers. This is an optional parameter and it will default to undefined.
  
  *Behavior*

  This method fires the request and **does not** need any additional call to `execute()`.
  If the request executes successfully it returns the body of the response.

- ```authenticate()``` <a name="authenticate"></a>

  *Behavior*

  Fires an authenticate request to SDP. After this request is fulfilled any further operation wll not require to reauthenticate.

- ```signOut()``` <a name="signOut"></a>

     *Behavior*
     
     Fires a sign out request to SDP. After this request is fulfilled any further operation wll need to reauthenticate.

#### Octane.entityTypes <a name="octane-entity-types"></a>

The Octane.entityTypes JSON contains all the entities present in the public API of SDP. This can be used in order
to access SDP entities.

#### Octane.operationTypes <a name="octane-operation-types"></a>

The Octane.operationTypes JSON contains all the operations that can be executed via the public API of SDP. This can be used in order
to generate custom requests.

## Usage examples

#### Get metadata

```javascript
  const octane = new Octane(...)
  
  //get all entities metadata
  const entitiesMetadata = await octane.get(Octane.entityTypes.entitiesMetadata).execute()

  //get all fields metadata
  const fieldsMetadata = await octane.get(Octane.entityTypes.fieldsMetadata).execute()

  //get all user defined fields
  const udfMetadata = await octane.get(octane.entityTypes.fieldsMetadata).query(Query.field('is_user_defined').equal(true).build()).execute()
```

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
  await octane.delete(Ocane.entityTypes.defects).query(Query.field('name').equal('new defect').build()).execute()
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

#### Attachments

```javascript
    // get the content of the attachment with id 1001
    let attachmentContent = await octane.getAttachmentContent(Octane.entityTypes.attachments).at(1001).execute()

    // an attachment will be uploaded for defect with id 1001
    let attachment = await octane.uploadAttachment('newAttachment.txt', 'This will be the content of the txt file', 'owner_work_item', 1001).execute()

```

#### Custom Requests

```javascript
    let url = '/api/shared_spaces/1001/users'
    //get the users from the shared space with id 1001 using the tech preview header
    let users = await octane.executeCustomRequest(url, Octane.operationTypes.get, undefined, { 'ALM-OCTANE-TECH-PREVIEW': true })
    //create user in octane
    let user = await octane.executeCustomRequest(url, Octane.operationTypes.create, { email: 'example@example.com', password: 'examplePassword' })
```

#### Query

The SDP REST API supports entities querying by filtering based on field values. To filter, use a query statement, which is 
comprised of at least one query phrase.

The client API provides the Query module to help you build the query, rather than writing the complex query statement. To pass
these queries to the SDK, use the `build()` method after the query is fully built.

```javascript
import { Query } from '@microfocus/alm-octane-js-rest-sdk'

// query statement: "id EQ 1005"
const query = Query.field('id').equal(1005)
// get defects with with ids in the 1001-1050 range
// the build() method is used when passing the query, as mentioned above
const queryDefect = await octane.get(Octane.entityTypes.defects).query(Query.field('id').between(1001, 1050).build()).execute()

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
Run all tests

```bash
$ npm test
```

Or run a specific test

```bash
$ npm test test/query.js
```

## What's new :newspaper: <a name="whats-new"></a>
* 25.2.0
  * Removed ON-BEHALF-OF header from `authenticate()` method
  
* 25.2.0
  * Removed generate-routes and OctaneVanilla
  * Upgraded `axios`
  * Removed unused libraries `command-line-args`, `debug`, `http-errors`, `pluralize`, `request`

* 25.1.0
  * Fixed vulnerable dependencies: `axios` and `apidoc`

* 24.2.1
  * Added support for providing custom cookie header

* 24.2.0
  * HTTP Proxy support
  * Added ability to use proxy with credentials

* 23.3.1
    * Rebranding

* 23.3.0
    * Query parameter is now encoded 

* 16.1.100-3
    * Hotfix for allowing strings as custom request bodies

* 16.1.100-2
    * Hotfix for Query class usage in JS

* 16.1.100 
    * Added autocomplete feature

* 16.0.400
    * Changed HTTP library from `request-promise-native` to `axios`
    * Added `authenticate()` method to `Octane` class
    * Added `executeCustomRequest()` method to `Octane` class which allows user to send requests to custom URLs

* 15.0.20
    * A generic way to interact with the ALM Octane API has been implemented as `Octane` class
    * The OctaneVanilla code has moved from ES5 to ES6
    * Old functionality is implemented in the `OctaneVanilla` class
    * The documentation for `OctaneVanilla` functionality can be found ~~[here](/lib/generate-routes/README.md)~~

## Disclaimer
Certain versions of software accessible here may contain branding from Hewlett-Packard Company (now HP Inc.) and Hewlett Packard Enterprise Company. This software was acquired by Micro Focus on September 1, 2017, and is now offered by OpenText. Any reference to the HP and Hewlett Packard Enterprise/HPE marks is historical in nature, and the HP and Hewlett Packard Enterprise/HPE marks are the property of their respective owners.
