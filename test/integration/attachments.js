/* eslint-env mocha */

'use strict'

var assert = require('assert')

var fs = require('fs')
var path = require('path')

var initializeOctaneClient = require('./helper').initializeOctaneClient

describe('[attachments]', function () {
  this.timeout(60000)

  var client
  var workItem
  var attachmentID
  var attachmentName = 'attachment.txt'
  var attachmentFile = path.join(__dirname, 'attachment-test.txt')
  var attachmentFileContent = 'This is an attachment test file.'

  before('initialize the Octane client', function (done) {
    var self = this

    initializeOctaneClient(function (err, aClient) {
      if (err) {
        var msg = err.message
        console.log('Aborted - %s',
          typeof msg === 'string' ? msg : JSON.stringify(msg)
        )
        self.skip()
      } else {
        client = aClient

        client.workItems.getAll({limit: 1}, function (err, workItems) {
          assert.equal(err, null)
          assert.equal(workItems.length, 1)

          workItem = workItems[0]

          fs.writeFileSync(attachmentFile, attachmentFileContent)
          done()
        })
      }
    })
  })

  after('delete the temporary test file', function () {
    if (fs.existsSync(attachmentFile)) {
      fs.unlinkSync(attachmentFile)
    }
  })

  it('should successfully create an attachment', function (done) {
    var attachment = {
      name: attachmentName,
      file: attachmentFile,
      owner_work_item: workItem
    }
    client.attachments.create(attachment, function (err, attachment) {
      assert.equal(err, null)
      assert(attachment.id)

      attachmentID = attachment.id
      done()
    })
  })

  it('should successfully get all attachments list', function (done) {
    client.attachments.getAll({}, function (err, attachments) {
      assert.equal(err, null)
      assert(attachments.meta.total_count > 0)
      done()
    })
  })

  it('should successfully get the attachment entity data', function (done) {
    client.attachments.get({id: attachmentID}, function (err, attachment) {
      assert.equal(err, null)
      assert.strictEqual(attachment.name, attachmentName)
      done()
    })
  })

  it('should successfully get the attachment binary data', function (done) {
    client.attachments.download({id: attachmentID}, function (err, data) {
      assert.equal(err, null)
      assert.strictEqual(data.toString(), attachmentFileContent)
      done()
    })
  })

  it('should successfully delete the attachment', function (done) {
    client.attachments.delete({id: attachmentID}, function (err) {
      assert.equal(err, null)
      done()
    })
  })
})
