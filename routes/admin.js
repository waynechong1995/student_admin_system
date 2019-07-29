const db = require('../models');

const _ = require('lodash');
const moment = require('moment');
const Promise = require('bluebird');

module.exports = {
    register(req, res) {
        const teacherEmail = req.body.teacher;
        const studentEmails = req.body.students;
        const currentTs = moment().unix();

        async function registerStudent() {
            async function resolveTeacher() {
                async function createTeacher() {
                    let newTeacher = {
                        email: teacherEmail,
                        timestamp_created: currentTs,
                        timestamp_updated: currentTs,
                    };
                    newTeacher = await db.teacher.create(newTeacher);
                    return newTeacher.toJSON();
                }

                let foundTeacher = await db.teacher.findOne({
                    where: {email: teacherEmail, deleted: 0},
                });

                if (!foundTeacher) foundTeacher = await createTeacher();
                return foundTeacher;
            }

            async function registerStudents(teacher) {
                async function resolveStudents() {
                    async function resolveStudent(studentEmail) {
                        async function createStudent() {
                            let newStudent = {
                                email: studentEmail,
                                timestamp_created: currentTs,
                                timestamp_updated: currentTs
                            };
                            newStudent = await db.student.create(newStudent);
                            return newStudent.toJSON();
                        }

                        let foundStudent = await db.student.findOne({
                            where: {email: studentEmail, deleted: 0},
                        });
                        if (!foundStudent) foundStudent = await createStudent();
                        return foundStudent;
                    }
                    return await Promise.map(studentEmails, (student) => resolveStudent(student));
                }

                async function resolveRegistrations(students) {
                    async function getDuplicateEntries() {
                        const studentIds = _.map(students, 'id');
                        const duplicateEntries = await db.class.findAll({
                            where: {
                                teacherid: teacher.id,
                                studentid: {$in: studentIds},
                                deleted: 0
                            },
                        });
                        return _.map(_.toJSON(duplicateEntries), 'studentid');
                    }

                    const duplicateStudentIds = await getDuplicateEntries();
                    const newStudentEntries =
                        _.filter(students, student => !_.includes(duplicateStudentIds, student.id));

                    const query = _.map(newStudentEntries, entry => ({
                        teacherid: teacher.id,
                        studentid: entry.id,
                        timestamp_created: currentTs,
                        timestamp_updated: currentTs,
                    }));

                    await db.class.bulkCreate(query);
                }

                await resolveStudents()
                    .then(resolveRegistrations);
            }

            return resolveTeacher()
                .then(registerStudents);
        }

        function response() {
            res.status(204).end();
        }

        registerStudent()
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

            const studentEntries = await db.class.findAll({
                attributes: ['studentid'],
                where: { teacherid: { $in: teacherIds }, deleted: 0 },
            });

            const studentIds =_.uniq(_.map(studentEntries, 'studentid'));

            const commonStudents = await db.student.findAll({
                attributes: ['email'],
                where: { id: { $in: studentIds } , deleted: 0 },
            });

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
            foundStudent = foundStudent.toJSON();
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
                console.log(err);
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
                  deleted: 0,
                  suspended: 0,
                  $or: [{ '$class.teacherid$': teacher.id }, { email: { $in: arrayOfEmails }}],
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
                console.log(err);
                res.status(400).json({ message: err.toString() });
            });
    },
};