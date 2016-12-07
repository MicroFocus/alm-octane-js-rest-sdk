/*!
 * (c) Copyright 2016 Hewlett Packard Enterprise Development LP
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

'use strict'

var assert = require('assert')

var Reference = require('../../lib/models/reference')

describe('models/reference', function () {
  var defect = {
    type: 'defect',
    creation_time: '2016-09-06T05:12:26Z',
    parent: { type: 'feature', name: 'Manage single chat', id: '1009' },
    logical_name: 'w5og0p7y5rkkpazd5w4g80z8x',
    version_stamp: 7,
    defect_root_level:
     { type: 'list_node',
       logical_name: 'list_node.defect_root_level.regression',
       name: 'Regression',
       index: 5,
       id: '1050' },
    release: { type: 'release', name: '741.5', id: '1005' },
    sprint:
     { type: 'sprint',
       end_date: '2017-02-02T12:00:00Z',
       name: 'Sprint 3',
       id: '1015',
       start_date: '2017-01-24T12:00:00Z' },
    description: '<html><body>\nTucga fo gore osji rov umuulo makahkok falul isdas tub bonojtus ozeitemam zubu leodevip. Lagice raj os lepgubvig lopladri sipoga wode ce reppeve rudvane uc en. Irodalka fasoke laif cohocza jake kodob uki wore nu wam wan fiwtu robo. Ehsug wobna bokiko wilsat efgiku ketiz ressuvu vebusgut zujoj bomsol fo sigodu. Suvihul bat dow wurrijec wojre useuba woto bebfas va gihtiz zoherkoj bejborno vib ah at.\n</body></html>',
    fixed_in_build: 11,
    detected_in_release: { type: 'release', name: '741.3', id: '1003' },
    path: '0000000000TL0000TN0000UN',
    item_origin:
     { type: 'list_node',
       logical_name: 'list_node.item_origin.jira',
       name: 'Jira',
       index: 4,
       id: '1042' },
    qa_owner:
     { type: 'workspace_user',
       full_name: 'sa@nga',
       name: 'sa@nga',
       id: '1001' },
    detected_by:
     { type: 'workspace_user',
       full_name: 'sa@nga',
       name: 'sa@nga',
       id: '1001' },
    closed_on: '2016-09-06T05:12:21Z',
    id: '1043',
    last_modified: '2016-09-06T05:12:27Z',
    defect_type:
     { type: 'list_node',
       logical_name: 'list_node.defect_type.Escaped',
       name: 'Escaped',
       index: 2,
       id: '1027' },
    phase: { type: 'phase', name: 'Proposed Closed', index: 4, id: '1005' },
    owner:
     { type: 'workspace_user',
       full_name: 'sa@nga',
       name: 'sa@nga',
       id: '1001' },
    severity:
     { type: 'list_node',
       logical_name: 'list_node.severity.low',
       name: 'Low',
       index: 1,
       id: '1002' },
    fixed_on: '2016-09-06T05:12:21Z',
    has_attachments: false,
    author:
     { type: 'workspace_user',
       full_name: 'sa@nga',
       name: 'sa@nga',
       id: '1001' },
    story_points: 4,
    product_areas: { total_count: 3, data: [Object] },
    team: null,
    priority:
     { type: 'list_node',
       logical_name: 'list_node.priority.very_high',
       name: 'Very High',
       index: 4,
       id: '1017' },
    user_tags: { total_count: 0, data: [] },
    has_comments: false,
    taxonomies: { total_count: 3, data: [Object] },
    name: 'After deletion chat still appears in the list',
    original_id: null,
    detected_in_build: 12
  }

  it('should parse the entity object', function () {
    var expect = new Reference(1043, 'defect')

    var ref = Reference.parse(defect)

    assert.deepStrictEqual(ref, expect)
  })

  it('should parse the Reference object', function () {
    var expect = new Reference(1043, 'defect')

    var ref = Reference.parse(Reference.parse(defect))

    assert.deepStrictEqual(ref, expect)
  })

  it('should output the correct JSON string', function () {
    var expect = '{"id":1043,"type":"defect"}'

    var ref = Reference.parse(defect)

    assert.strictEqual(JSON.stringify(ref), expect)
  })
})
