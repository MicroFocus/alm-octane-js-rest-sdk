/* eslint-env mocha */

'use strict'

var assert = require('assert')

var Reference = require('../../lib/models/reference')
var MultiReference = require('../../lib/models/multi-reference')

describe('models/multi-reference', function () {
  var defects = [
  { type: 'defect',
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
    detected_in_build: 12 },
  { type: 'defect',
    creation_time: '2016-09-06T05:12:20Z',
    parent: { type: 'feature', name: 'General', id: '1011' },
    logical_name: 'jy9kl37py22jmcw29qv6p0ze4',
    version_stamp: 6,
    defect_root_level:
     { type: 'list_node',
       logical_name: 'list_node.defect_root_level.regression',
       name: 'Regression',
       index: 5,
       id: '1050' },
    release: { type: 'release', name: '741.4', id: '1004' },
    sprint:
     { type: 'sprint',
       end_date: '2016-12-24T12:00:00Z',
       name: 'Sprint 2',
       id: '1011',
       start_date: '2016-12-15T12:00:00Z' },
    description: '<html><body>\nSaim pusi meade tasahmeb dig dempig necduda numhotha vercocan rase huf vulehu agjuz noos. Alozuki suwufged wodagci zasapna ekgepmam hevten zeftaj ab wad zilos zahtu zuopidon kofhil micuona demsov je. Biijute worbu lelut fu alaijueja ga mus ajehel nafoce de ji puatwul pocbopa liota. Ra fufsod etsow net pacdipro leg vo jufdil ma nike sej zitaf lien juj dipikkin. Gola miv tufoc lag hakke esiehjew pege tanoma abopjek dasegha emsitkev zi bozva jeteb kon. To bac eha muvikuge rebu okhinzow dem meradive gujuiwu av mereghoz ide. Pelhog egurti duum dobwepah ju wecfarid pamukiir eha sa cupcis wekom misi tam niazegil niz menelhe.\n</body></html>',
    fixed_in_build: 11,
    detected_in_release: { type: 'release', name: '741.5', id: '1005' },
    path: '0000000000TM0000TP0000UD',
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
    id: '1033',
    last_modified: '2016-09-06T05:12:20Z',
    defect_type:
     { type: 'list_node',
       logical_name: 'list_node.defect_type.Escaped',
       name: 'Escaped',
       index: 2,
       id: '1027' },
    phase: { type: 'phase', name: 'Fixed', index: 2, id: '1003' },
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
    story_points: 19,
    product_areas: { total_count: 2, data: [Object] },
    team: null,
    priority:
     { type: 'list_node',
       logical_name: 'list_node.priority.very_high',
       name: 'Very High',
       index: 4,
       id: '1017' },
    user_tags: { total_count: 0, data: [] },
    has_comments: false,
    taxonomies: { total_count: 2, data: [Object] },
    name: 'App crashed when Other permissions were disabled',
    original_id: null,
    detected_in_build: 8 }
  ]
  defects.meta = { total_count: 24 }

  it('should parse the array of entity objects', function () {
    var expect = new MultiReference([
      new Reference(1043, 'defect'),
      new Reference(1033, 'defect')
    ])

    var refs = MultiReference.parse(defects)

    assert.deepStrictEqual(refs, expect)
  })

  it('should parse the MultiReference object', function () {
    var expect = new MultiReference([
      new Reference(1043, 'defect'),
      new Reference(1033, 'defect')
    ])

    var refs = MultiReference.parse(MultiReference.parse(defects))

    assert.deepStrictEqual(refs, expect)
  })

  it('should output the correct JSON string', function () {
    var expect = '{"total_count":2,"data":[{"id":1043,"type":"defect"},{"id":1033,"type":"defect"}]}'

    var refs = MultiReference.parse(defects)

    assert.strictEqual(JSON.stringify(refs), expect)
  })
})
