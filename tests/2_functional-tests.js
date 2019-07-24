/*
 *
 *
 *       FILL IN EACH FUNCTIONAL TEST BELOW COMPLETELY
 *       -----[Keep the tests in the same order!]-----
 *       (if additional are added, keep them at the very end!)
 */

var chaiHttp = require('chai-http');
var chai = require('chai');
var assert = chai.assert;
var server = require('../server');

var ObjectId = require('mongodb').ObjectId;

chai.use(chaiHttp);

let testing;
let testId;

suite('Functional Tests', function () {

  suite('API ROUTING FOR /api/threads/:board', function () {

    suite('POST /api/threads => test thread', function () {
      test("Test POST /api/threads/test => test thread with text and password", (done) => {
        chai.request(server)
          .post("/api/threads/test")
          .send({
            text: 'Test 1',
            delete_password: 'pass'
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.property(res.body, "_id", "thread should contain _id");
            assert.equal(res.body.board, "test", "Board should be correct");
            assert.equal(res.body.text, "Test 1", "Text should be correct");
            assert.isOk(res.body.created_on, "created_on should be ok");
            assert.isOk(res.body.bumped_on, "bumped_on should be ok");
            assert.equal(res.body.reported, false, "Reported should be false");
            assert.equal(res.body.delete_password, "pass", "delete_password should be correct");
            assert.isArray(res.body.replies, "Replies should be an array");
            testing = res.body._id;
            done();
          });
      });

      test("Test POST /api/threads/test => test thread with only text field", function (done) {
        chai.request(server)
          .post("/api/threads/test")
          .send({
            text: "Test 2"
          })
          .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.property(res.body, '_id');
            assert.equal(res.body.board, 'test');
            assert.equal(res.body.text, 'Test 2');
            assert.equal(res.body.reported, false);
            assert.equal(res.body.delete_password, '');
            assert.isArray(res.body.replies);
            done();
          });
      });

    });

    suite('GET /api/threads/ => get the recent threads', function () {

      test('Test GET /api/threads/ => list of recent threads', (done) => {
        chai.request(server)
          .get('/api/threads/test')
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.isArray(res.body, "Response should be an array");
            assert.isAtMost(res.body.length, 10);
            assert.property(res.body[0], "text");
            assert.property(res.body[0], "board");
            assert.property(res.body[0], "_id");
            assert.isOk(res.body[0].created_on, "created_on should be ok");
            assert.isOk(res.body[0].bumped_on, "bumped_on should be ok");
            assert.notProperty(res.body[0], "reported");
            assert.notProperty(res.body[0], "delete_password", "delete_password should be not sent");
            assert.isArray(res.body[0].replies, "Replies should be an array");
            assert.isAtMost(res.body[0].replies.length, 3);
            done();
          })
      })

      test('Test GET /api/threads/ => no threads', (done) => {
        chai.request(server)
          .get('/api/threads/test2')
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'there are no threads on the board');
            done();
          });
      });

    });

    suite('PUT /api/threads/', function () {
      testId = '5d3777ff73313018ea00951f';

      test("Test PUT /api/threads/ => successfully update thread", function (done) {
        chai.request(server)
          .put("/api/threads/test")
          .send({
            thread_id: testId
          })
          .end(function (err, res) {
            assert.equal(res.status, 200);
            assert.equal(res.text, "success");
            done();
          });
      });

    });

    suite('DELETE /api/threads/', function () {
      testId = '5d3777ff73313018ea00951f';

      test('Test DELETE /api/threads/ => successfully delete thread', (done) => {
        chai.request(server)
          .delete('/api/threads/test')
          .send({
            thread_id: testId,
            delete_password: 'pass'
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'success');
            done();
          });
      });

    });

  });

  suite('API ROUTING FOR /api/replies/:board', function () {

    suite('POST /api/replies/', function () {
      testId = '5d38cfc811df557c589eebdd';

      test("Test POST /api/replies/ => use all fields to reply", function (done) {
        chai.request(server)
          .post(`/api/replies/test`)
          .send({
            thread_id: testId,
            text: 'Reply Test',
            delete_password: 'pass'
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.redirects[0].substring(res.redirects[0].length - 7), 'a00951f')
            done();
          });
      });

    });

    suite('GET /api/replies/', function () {

      test('Test GET /api/replies/ => Valid id', (done) => {
        chai.request(server)
          .get('/api/replies/test')
          .query({
            thread_id: testing
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.property(res.body, '_id');
            done()
          })
      })
    });

    suite('PUT /api/replies/', function () {
      testId = '5d3777ff73313018ea00951f';
      let replyId;

      test('Test PUT /api/replies/ => Reported reply', (done) => {
        chai.request(server)
          .put('/api/replies/test')
          .send({
            thread_id: testing,
            reply_id: replyId
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'success');
            done()
          });
      })

    });

    suite('DELETE /api/replies/', function () {
      let threadId = '5d3777ff73313018ea00951f';
      let replyId;
      let wrongPass;

      test('Test DELETE /api/replies/ => successfully delete a reply', (done) => {
        chai.request(server)
          .delete('/api/replies/test')
          .send({
            thread_id: new ObjectId(threadId),
            reply_id: replyId,
            delete_password: wrongPass
          })
          .end((err, res) => {
            assert.equal(res.status, 200);
            assert.equal(res.text, 'Invalid password or id...');
            done();
          });
      })
    });


  });

});
