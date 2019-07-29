"use strict";
const admin = require('./admin');
const { body, query, validationResult } = require('express-validator');

function sendError(res, errors) {
    res.status(400).json({ message: errors.array() });
}

module.exports = function (router) {
  router.route('/register').post([
      body('teacher').exists(),
      body('teacher').isEmail(),
      body('students').exists(),
      body('students').isArray(),
      body('students.*').isEmail(),
  ], (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) sendError(res, errors);
      else admin.register(req, res);
  });

  router.route('/commonstudents').get([
      query('teacher.*').isEmail(),
  ], (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) sendError(res, errors);
      else admin.commonstudents(req, res);
  });

  router.route('/suspend').post([
      body('student').exists(),
      body('student').isEmail(),
  ], (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) sendError(res, errors);
      else admin.suspend(req, res);
  });

  router.route('/retrievefornotifications').post([
      body('teacher').exists(),
      body('teacher').isEmail(),
      body('notification').exists(),
      body('notification').isString(),
      ],
      (req, res) => {
      admin.retrievefornotifications(req, res);
  });
};


