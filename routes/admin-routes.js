"use strict";
const admin = require('./admin');
const { body, query, validationResult } = require('express-validator');

function sendError(res, errors) {
    res.status(400).json({ message: errors.array() });
}

module.exports = function (router) {
  router.route('/register').post([
      body('teacher').exists().withMessage('Missing "teacher" param'),
      body('teacher').isEmail().withMessage('Invalid "teacher" param, should be email'),
      body('students').exists().withMessage('Missing "students" param'),
      body('students').isArray().withMessage('Invalid "students" param, should be array'),
      body('students.*').isEmail().withMessage('Invalid "students" param, should be email'),
  ], (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) sendError(res, errors);
      else admin.register(req, res);
  });

  router.route('/commonstudents').get([
      query('teacher.*').isEmail().withMessage('Invalid "teacher" param, should be email'),
  ], (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) sendError(res, errors);
      else admin.commonstudents(req, res);
  });

  router.route('/suspend').post([
      body('student').exists().withMessage('Missing "student" param'),
      body('student').isEmail().withMessage('Invalid "student" param, should be email'),
  ], (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) sendError(res, errors);
      else admin.suspend(req, res);
});

  router.route('/retrievefornotifications').post([
      body('teacher').exists().withMessage('Missing "teacher" param'),
      body('teacher').isEmail().withMessage('Invalid "teacher" param, should be email'),
      body('notification').exists().withMessage('Missing "notification" param'),
      body('notification').isString().withMessage('Invalid "notification" param, should be a string'),
      ],
      (req, res) => {
      const errors = validationResult(req);
      if (!errors.isEmpty()) sendError(res, errors);
      admin.retrievefornotifications(req, res);
  });
};


