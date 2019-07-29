const config = require('../config');
const dbConfig = config.sequelize;
const tableList = require('./tablelist');

const path = require('path');
const Sequelize = require('sequelize');
const sequelize = new Sequelize(
	(process.env.NODE_ENV === 'test' ? dbConfig.testdb : dbConfig.db ),
	dbConfig.username,
	dbConfig.password, {
	host: dbConfig.host,
	logging: false,
	dialect: 'mysql',
	pool: {
		max: 50,
		min: 0,
		idle: 10000
	}
});

const fs = require('fs');
const _ = require('lodash');

const db = _.cloneDeep(tableList);

sequelize.authenticate()
	.then((err) => {
			if (err) {
				console.error('Error: Unable to connect to the database', err);
			} else {
				console.log('LOG: DB connection has been established successfully');
			}
	})
	.catch((err) => {
		console.error('ERROR: Timeout when connecting to DB. Check Connection To Db', err);
	});

fs.readdirSync(__dirname.concat('/tables/'))
	.filter(file => (file.indexOf('./tables/') !== 0))
	.forEach((file) => {
		const model = sequelize.import(path.join(__dirname.concat('/tables/'), file));
		db[model.name] = model;
	});

Object.keys(db).forEach((modelName) => {
	if ('classMethods' in db[modelName].options) {
		if ('associate' in db[modelName].options['classMethods']) {
			db[modelName].options.classMethods.associate(db);
		}
	}
});

db.sequelize = sequelize;
db.Sequelize = Sequelize;

function toJSON(collection) {
	return _.map(collection, (object) => {
		if (typeof object.toJSON === 'function') object = object.toJSON();
		return object;
	});
}

_.mixin({ toJSON: toJSON });

module.exports = db;




