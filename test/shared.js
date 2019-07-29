const Promise = require('bluebird');

const db = require('../models');

module.exports = {
    emptyAllTables() {
        const listOfTables = db.sequelize.models;
        return Promise.each(Object.keys(listOfTables), tableName => db[tableName].truncate());
    },
    loadDefaultData() {
        const defaultTeachers = [
            { email: 'teacherken@gmail.com' },
            { email: 'teacherjoe@gmail.com' },
        ];
        return db.teacher.bulkCreate(defaultTeachers);
    },
};