/*
 *
 *
 *       Complete the API routing below
 *
 *
 */

'use strict';

var expect = require('chai').expect;
var MongoClient = require('mongodb').MongoClient
var ObjectId = require('mongodb').ObjectId;
const CONNECTION_STRING = process.env.DB;


module.exports = function (app, db) {

  app.route('/api/threads/:board')
    .get((req, res) => {
      let board = req.params.board;
      MongoClient.connect(CONNECTION_STRING, (err, client) => {
        client.db('test').collection('board').aggregate([{
              $match: {
                board: board
              }
            },
            {
              $sort: {
                bumped_on: -1
              }
            },
            {
              $limit: 10
            },
            {
              $project: {
                delete_password: 0,
                reported: 0
              }
            }
          ])
          .toArray((err, data) => {
            if (err) {
              res.send(err);
            }
            if (data.length === 0) {
              res.send('there are no threads on the board')
              return;
            } else {
              data.forEach((item) => {
                if (item.replies != undefined && item.replies.length > 2) {
                  item.replies = item.replies.slice(0, 2);
                }
              })
              res.send(data);
            }
          })
      })
    })
    .post((req, res, next) => {
      let board = req.params.board;
      let text = req.body.text;
      if (!text) {
        let err = new Error('Empty field');
        err.status = 400;
        throw err;
      }

      MongoClient.connect(CONNECTION_STRING, (err, client) => {
        let del_pass = req.body.delete_password;
        let created_on = new Date();
        let pass = del_pass ? del_pass : '';
        client.db('test').collection('board').insertOne({
            board: board,
            text: text,
            created_on: created_on,
            bumped_on: created_on,
            reported: false,
            delete_password: pass,
            replies: []
          },
          (err, data) => {
            if (err) {
              res.send(err);
            }
            if (data.ops.length === 0) {
              let err = new Error('error occurred');
              err.status = 400;
              next(err);
            } else {
              res.send(data.ops[0]);
            }
          });
      });
    })
    .put((req, res, next) => {
      let thread_id;
      let err = new Error();
      try {
        thread_id = ObjectId(req.body.thread_id)
      } catch (e) {
        err.message = 'Invalid id';
        err.status = 400;
        next(err);
        return;
      }
      MongoClient.connect(CONNECTION_STRING, (err, client) => {
        client.db('test').collection('board').updateOne({
            _id: thread_id
          }, {
            $set: {
              reported: true
            }
          },
          (err, data) => {
            if (err) {
              res.send(err);
            }
            if (data.value) {
              res.send('Invalid id or password');
              res.status(400);
              next(err);
            } else {
              res.send('success');
            }
          });
      });
    })
    .delete((req, res, next) => {
      let thread_id = ObjectId(req.body.thread_id);
      let del_pass = req.body.delete_password;
      let err = new Error();
      try {
        thread_id;
        del_pass;
        if (!thread_id || !del_pass) {
          err.message = 'Invalid id or password';
          err.status = 400;
          throw err;
        }
      } catch (e) {
        err.message = 'Invalid id or password';
        err.status = 400;
        next(err);
        return;
      }
      MongoClient.connect(CONNECTION_STRING, (err, client) => {
        client.db('test').collection('board').deleteOne({
            _id: thread_id,
            delete_password: del_pass
          }, {
            reported: true
          },
          (err, data) => {
            if (err) {
              res.send(err);
            }
            if (data.value) {
              res.send('Invalid id or password');
              res.status(400);
              next(err);
            } else {
              res.send('success');
            }
          });
      });
    });

  app.route('/api/replies/:board')
    .get((req, res, next) => {
      let thread_id;
      try {
        if (!req.query.thread_id) {
          throw new Error();
        }
        thread_id = ObjectId(req.query.thread_id);
      } catch (err) {
        err.message = 'Invalid id';
        res.status(400);
        next(err);
        return;
      }
      MongoClient.connect(CONNECTION_STRING, (err, client) => {
        client.db('test').collection('board').findOne({
            _id: thread_id
          }, {
            fields: {
              reported: 0,
              delete_password: 0
            }
          },
          (err, data) => {
            if (err) {
              res.send(err);
            }
            if (!data) {
              let err = new Error("Thread doesn't exist")
              // err.status = 400;
              res.status(400);
              next(err);
            } else {
              res.send(data);
            }
          });
      });
    })
    .post((req, res) => {
      let board = req.params.board;
      let thread_id = req.body.thread_id;

      let reply = {
        _id: new ObjectId(),
        text: req.body.text,
        created_on: new Date(),
        delete_password: req.body.delete_password ? req.body.delete_password : '',
        reported: false,
      };

      if (!reply.text || !reply.delete_password) {
        res.send('Invalid id or password')
      } else {
        MongoClient.connect(CONNECTION_STRING, (err, client) => {

          client.db('test').collection('board').findOneAndUpdate({
            _id: new ObjectId(thread_id)
          }, {
            $push: {
              replies: {
                $each: [reply],
                $position: 0
              }
            },
            $set: {
              bumped_on: reply.created_on
            }
          }, {
            returnOriginal: false
          }, (err, data) => {
            res.redirect(`/b/${board}/${thread_id}`)
          });
        });
      }
    })
    .put((req, res) => {
      let thread_id = req.body.thread_id;
      let reply_id = req.body.reply_id;
      
      if(!thread_id || !ObjectId.isValid(thread_id)) {
        res.send('Invalid password or id')
      } else {
        MongoClient.connect(CONNECTION_STRING, (err, client) => {
          client.db('test').collection('board').findOneAndUpdate({
              _id: new ObjectId(thread_id),
              'replies._id': new ObjectId(reply_id)
            }, {
              $set: {
                'replies.$.reported': true
              }
            },
            (err, data) => {
              data.value ? res.send('Invalid id') : res.send('success')
            });
        });
      }

    })
    .delete((req, res) => {
      let thread_id = req.body.thread_id;
      let reply_id = req.body.reply_id;
      let delete_password = req.body.delete_password;
      
      if(!thread_id || !delete_password || !ObjectId.isValid(thread_id)) {
        res.send('Invalid password or id...')
      } else {
        MongoClient.connect(CONNECTION_STRING, (err, client) => {
          client.db('test').collection('board').findOneAndUpdate({
              _id: new ObjectId(thread_id),
              'replies._id': new ObjectId(reply_id),
              'replies.delete_password': delete_password
            }, {
              $set: {
                'replies.$.text': 'deleted'
              }
            },
            (err, data) => {
              data.value ? res.send('success') : res.send('Invalid password')
            });
        })

      }
    })

};
