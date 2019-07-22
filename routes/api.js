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

    })
    
    .post((req, res) => {
      
    })

    .put((req, res) => {
      
    })

    .delete((req, res) => {
      
    })

  app.route('/api/replies/:board')

  .get((req, res) => {
      
  })

  .post((req, res) => {
      
  })

  .put((req, res) => {
      
  })

  .delete((req, res) => {
      
  })

};
