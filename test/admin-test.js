process.env.NODE_ENV = 'test';

const expect = require('chai').expect;
const supertest = require('supertest');
const _ = require('lodash');

const t = require('./shared');
const app = require('../app.js');
const db = require('../models');

describe('/api/admin', () => {
    before(() => t.emptyAllTables());

    describe('/register', () => {
        before(() => t.loadDefaultData());

        it('should create student and assigned to specific teacher', (done) => {

            let teacherid = 1;
            const expectedRegisteredStudents =
                ["student_only_under_teacherken1@gmail.com", "student_only_under_teacherken2@gmail.com"];
            // act
            const body = {
                "teacher": "teacherken@gmail.com",
                "students":
                    [
                        "student_only_under_teacherken1@gmail.com",
                        "student_only_under_teacherken2@gmail.com"
                    ]
            };
            supertest(app).post('/api/register')
                .set('Accept', 'application/json')
                .send(body)
                .expect('Content-Type', /json/)
                .expect(204)
                .end(() => {

                    db.student.findAll({
                        where: {email: {$in: expectedRegisteredStudents}, deleted: 0},
                        include: [{model: db.class, as: 'class', where: {teacherid, deleted: 0}}],
                    }).then((_students) => {
                        const students = _.toJSON(_students);
                        const studentEmails = _.map(students, 'email');
                        expect(studentEmails).to.be.an('array');
                        studentEmails.every(i => expect(i).to.be.a('string'));
                        expect(studentEmails).to.have.members(expectedRegisteredStudents);
                        done();
                    });
                });
        });

        after(() => t.emptyAllTables());
    });

    describe('/commonstudents', () => {
        async function arrange() {
            const students = [
                {email: 'student_only_under_teacherken1@gmail.com'},
                {email: 'student_only_under_teacherken2@gmail.com'},
                {email: 'student_only_under_teacherjoe@gmail.com'},
                {email: 'common_student1@gmail.com'}
            ];
            const classes = [
                {teacherid: 1, studentid: 1},
                {teacherid: 1, studentid: 2},
                {teacherid: 1, studentid: 4},
                {teacherid: 2, studentid: 3},
                {teacherid: 2, studentid: 4},
            ];
            const createStudents = await db.student.bulkCreate(students);
            const createClasses = await db.class.bulkCreate(classes);
            return Promise.all([createStudents, createClasses]);
        }

        before(() => t.loadDefaultData().then(arrange));

        it('should return students belonged to specific teacher', (done) => {
            const expectedStudentEmails = [
                'common_student1@gmail.com',
                'student_only_under_teacherken1@gmail.com',
                'student_only_under_teacherken2@gmail.com'
            ];
            const queryString = 'teacher[]=teacherken@gmail.com';
            supertest(app).get('/api/commonstudents')
                .set('Accept', 'application/json')
                .query(queryString)
                .expect('Content-Type', /json/)
                .expect(204)
                .end((err, res) => {

                    expect(res.body.students).to.exist;
                    expect(res.body.students).to.be.an('array');
                    _.each(res.body.students, (student) => {
                        expect(student).to.be.a('string');
                    });
                    expect(res.body.students).to.have.members(expectedStudentEmails);
                    done();
                });

        });

        it('should return common students belonged to teachers', (done) => {
            const expectedStudentEmails = [
                'common_student1@gmail.com',
                'student_only_under_teacherken1@gmail.com',
                'student_only_under_teacherken2@gmail.com',
                'student_only_under_teacherjoe@gmail.com',
            ];
            const queryString = 'teacher=teacherken@gmail.com&teacher=teacherjoe@gmail.com';
            supertest(app).get('/api/commonstudents')
                .set('Accept', 'application/json')
                .query(queryString)
                .expect('Content-Type', /json/)
                .expect(204)
                .end((err, res) => {

                    expect(res.body.students).to.exist;
                    expect(res.body.students).to.be.an('array');
                    _.each(res.body.students, (student) => {
                        expect(student).to.be.a('string');
                    });
                    expect(res.body.students).to.have.members(expectedStudentEmails);
                    done();
                });

        });

        after(() => t.emptyAllTables());
    });

    describe('/suspend', () => {
        before(() => t.loadDefaultData());

        it('should suspend student', (done) => {
            async function arrange() {
                const students = [
                    {email: 'student_only_under_teacherken1@gmail.com'},
                    {email: 'student_only_under_teacherken2@gmail.com'},
                    {email: 'student_only_under_teacherjoe@gmail.com'},
                ];
                const classes = [
                    {teacherid: 1, studentid: 1},
                    {teacherid: 1, studentid: 2},
                    {teacherid: 2, studentid: 3},
                ];
                const createStudents = await db.student.bulkCreate(students);
                const createClasses = await db.class.bulkCreate(classes);
                return Promise.all([createStudents, createClasses]);
            }

            arrange()
                .then(() => {
                    const targetStudentEmail = 'student_only_under_teacherjoe@gmail.com';
                    const body = {student: "student_only_under_teacherjoe@gmail.com"};
                    supertest(app).post('/api/suspend')
                        .set('Accept', 'application/json')
                        .send(body)
                        .expect('Content-Type', /json/)
                        .expect(204)
                        .end(() => {

                            db.student.findOne({
                                where: {email: targetStudentEmail, deleted: 0},
                            }).then((_student) => {
                                const student = _student.toJSON();
                                expect(student.suspended).to.equal(1);
                                done();
                            });
                        });
                });
        });

        after(() => t.emptyAllTables());
    });

    describe('/retrievefornotifications', () => {
        async function arrange() {
            const students = [
                {email: 'student_only_under_teacherken1@gmail.com'},
                {email: 'student_only_under_teacherken2@gmail.com'},
                {email: 'student_only_under_teacherjoe@gmail.com'},
                {email: 'common_suspended_students01@gmail.com', suspended: 1},
            ];
            const classes = [
                {teacherid: 1, studentid: 1},
                {teacherid: 1, studentid: 2},
                {teacherid: 1, studentid: 4},
                {teacherid: 2, studentid: 3},
                {teacherid: 2, studentid: 4},
            ];
            const createStudents = await db.student.bulkCreate(students);
            const createClasses = await db.class.bulkCreate(classes);
            return Promise.all([createStudents, createClasses]);
        }

        before(() => t.loadDefaultData().then(arrange));

        it('should not return suspended student emails', (done) => {
            const expectedStudentEmails = [
                'student_only_under_teacherken1@gmail.com',
                'student_only_under_teacherken2@gmail.com'
            ];
            const body = {
                "teacher": "teacherken@gmail.com",
                "notification": "Hello students! @student_only_under_teacherken1@gmail.com @common_suspended_students01@gmail.com"
            };
            supertest(app).post('/api/retrievefornotifications')
                .set('Accept', 'application/json')
                .send(body)
                .expect('Content-Type', /json/)
                .expect(204)
                .end((err, res) => {

                    expect(res.body.receipients).to.exist;
                    expect(res.body.receipients).to.be.an('array');
                    res.body.receipients.every(i => expect(i).to.be.a('string'));
                    expect(res.body.receipients).to.have.members(expectedStudentEmails);
                    done();
                });
        });

        it('should return students of specified teacher', (done) => {
            const expectedStudentEmails = [
                'student_only_under_teacherken1@gmail.com',
                'student_only_under_teacherken2@gmail.com'
            ];
            const body = {
                "teacher": "teacherken@gmail.com",
                "notification": "Hello students!"
            };
            supertest(app).post('/api/retrievefornotifications')
                .set('Accept', 'application/json')
                .send(body)
                .expect('Content-Type', /json/)
                .expect(204)
                .end((err, res) => {

                    expect(res.body.receipients).to.exist;
                    expect(res.body.receipients).to.be.an('array');
                    res.body.receipients.every(i => expect(i).to.be.a('string'));
                    expect(res.body.receipients).to.have.members(expectedStudentEmails);
                    done();
                });
        });

        it('should return students of specified teacher or mentioned in @', (done) => {
            const expectedStudentEmails = [
                'student_only_under_teacherken1@gmail.com',
                'student_only_under_teacherken2@gmail.com',
                'student_only_under_teacherjoe@gmail.com',
            ];
            const body = {
                "teacher": "teacherken@gmail.com",
                "notification": "Hello students!, @student_only_under_teacherjoe@gmail.com"
            };
            supertest(app).post('/api/retrievefornotifications')
                .set('Accept', 'application/json')
                .send(body)
                .expect('Content-Type', /json/)
                .expect(204)
                .end((err, res) => {

                    expect(res.body.receipients).to.exist;
                    expect(res.body.receipients).to.be.an('array');
                    res.body.receipients.every(i => expect(i).to.be.a('string'));
                    expect(res.body.receipients).to.have.members(expectedStudentEmails);
                    done();
                });
        });

        after(() => t.emptyAllTables());
    });
});