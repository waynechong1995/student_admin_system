const db = require('../models');

const _ = require('lodash');
const moment = require('moment');
const Promise = require('bluebird');

module.exports = {
    register(req, res) {
        const teacherEmail = req.body.teacher;
        const studentEmails = req.body.students;
        const currentTs = moment().unix();

        async function registerStudents() {
            const transaction = await db.sequelize.transaction();
            try {
                const resolveTeacher = () => db.teacher.findOrCreate({
                    where: {email: teacherEmail, deleted: 0},
                    defaults: {timestamp_created: currentTs, timestamp_updated: currentTs,}
                }).then(teacherData =>  teacherData[0]);

                const resolveStudents = () => Promise.map(studentEmails, (studentEmail) => {
                    return db.student.findOrCreate({
                        where: {email: studentEmail, deleted: 0},
                        defaults: {timestamp_created: currentTs, timestamp_updated: currentTs,}
                    }).then(studentData =>  studentData[0]);

                });

                const data = await Promise.all([resolveTeacher(), resolveStudents()] );
                const teacher = data[0];
                const students = data[1];

                await Promise.map(students, (student) => {
                    return db.class.findOrCreate({
                        where: {teacherid: teacher.id, studentid: student.id, deleted: 0},
                        defaults: {timestamp_created: currentTs, timestamp_updated: currentTs,}
                    });
                });

                await transaction.commit();
            } catch (e) {
                await transaction.rollback();
                throw new Error(e);
            }
        }

        function response() {
            res.status(204).end();
        }

        registerStudents()
            .then(response)
            .catch((err) => {
                res.status(400).json({ message: err.toString() });
            });
    },

    commonstudents(req, res) {
        let teacherEmails = req.query.teacher;
        if (_.isString(teacherEmails)) teacherEmails = [teacherEmails];
        async function getStudents() {
            const teachers = await db.teacher.findAll({
                where: { email: { $in: teacherEmails }, deleted: 0 },
            });
            const teacherIds = _.map(_.toJSON(teachers), 'id');
            const commonQuery = {
                attributes: ['email'],
                where: {
                    deleted: 0,
                    '$class.teacherid$': {$in: teacherIds},
                    '$class.deleted$': 0,
                },
                group: ['class.studentid'],
                include: [{attributes: [], model: db.class, as: 'class'}],
                having: db.sequelize.literal(`count(class.studentid) >= ${teacherIds.length}`),
            };
            const commonStudents = await db.student.findAll(commonQuery);
            return _.map(_.toJSON(commonStudents), 'email');
        }

        function response(studentEmails) {
            res.status(200).json({ students: studentEmails });
        }

        getStudents()
            .then(response)
            .catch((err) => {
                res.status(400).json({ message: err.toString() });
            });
    },

    suspend(req, res) {
        const studentEmail = req.body.student;
        const currentTs = moment().unix();

        async function validateStudent() {
            let foundStudent = await db.student.findOne({
                attributes: ['id', 'suspended'],
                where: { email: studentEmail, deleted: 0 },
            });
            if (!foundStudent) throw new Error('Student not found');
            if (foundStudent.suspended) throw new Error('Student already suspended');
            return foundStudent;
        }

        async function suspendStudent(student) {
            await db.student.update({ suspended: 1, timestamp_updated: currentTs }, { where: { id: student.id }});
        }

        function response() {
            res.status(204).end();
        }

        validateStudent()
            .then(suspendStudent)
            .then(response)
            .catch((err) => {
                res.status(400).json({ message: err.toString() });
            });
    },

    retrievefornotifications(req, res) {
        const teacherEmail = req.body.teacher;
        const notification = req.body.notification;

        async function validateTeacher() {
            let foundTeacher = await db.teacher.findOne({
                attributes: ['id', 'email'],
                where: { email: teacherEmail, deleted: 0 },
            });
            if (!foundTeacher) throw new Error('Teacher not found');
            return foundTeacher.toJSON();
        }

        async function getNotificationStudents(teacher) {
            let arrayOfEmails = [];
            function extractTagEmails() {
                const regex = /([a-zA-Z0-9._-]+@[a-zA-Z0-9._-]+\.[a-zA-Z0-9._-]+)/gi;
                arrayOfEmails = notification.match(regex) || [];
            }
            extractTagEmails();
            const query = {
              attributes: ['email'],
              where: {
                  suspended: 0,
                  $or: [{ '$class.teacherid$': teacher.id }, { email: { $in: arrayOfEmails }}],
                  deleted: 0,
                  '$class.deleted$': 0,
              },
              include: [{ model: db.class, as: 'class', required: false }],
            };

            const students = await db.student.findAll(query);
            return _.map(_.toJSON(students), 'email');
        }

        function response(students) {
            res.status(200).json({ receipients: students });
        }

        validateTeacher()
            .then(getNotificationStudents)
            .then(response)
            .catch((err) => {
                res.status(400).json({ message: err.toString() });
            });
    },
};