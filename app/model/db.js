const mysql = require('mysql'); // or use import if you use TS
const util = require('util');

const pool = mysql.createPool({
	connectionLimit: 10,
	host: process.env['DB_HOST'],
	user: process.env['DB_USER'],
	password: process.env['DB_PASSWORD'],
	database: process.env['DB_DATABASE'],
	ssl: {
		// DO NOT DO THIS
		// set up your ca correctly to trust the connection
		rejectUnauthorized: false
	}
});

// node native promisify
const query = util.promisify(pool.query).bind(pool);

module.exports.upsertOne = async function (tableName, doc) {
	if (!tableName || !doc) throw new Error('table name and document cannot be null');
	const numOfKeys = Object.keys(doc).length;

	if (numOfKeys < 1) return;

	var insertStr = `REPLACE INTO ${tableName}`;
	var keyStr = '(';
	var valStr = 'VALUES (';
	Object.keys(doc).forEach((key, index) => {
		var val = doc[key];
		if (val != undefined) {
			keyStr += index < numOfKeys - 1 ? ` ${key},` : ` ${key} )`;
			valStr += index < numOfKeys - 1 ? `"${val}",` : ` "${val}")`;
		}
	})
	const queryStr = `${insertStr} ${keyStr} ${valStr}`;

	await query(queryStr).catch(err => { console.log(err); });
}

module.exports.find = async function (subject, conditions, options) {
	if (!subject['tableName']) throw new Error('table name cannot be empty');

	var selectStr = '';
	var queryStr = '';
	var whereStr = '';
	var groupByStr = '';
	var orderByStr = '';
	var limitStr = '';

	var metric = '*';

	if (subject['metric'] && subject['aggregation']) {
		metric = `${subject['aggregation']}(${subject['metric']})`;
	}

	if (conditions && Object.keys(conditions).length > 0) {
		whereStr += 'WHERE';
		if (conditions['equals'] && conditions['equals'].length != 0) {
			if (whereStr.length > 5) whereStr += ' AND';
			conditions['equals'].forEach((condition, index) => {
				const key = Object.keys(condition)[0];
				const val = condition[key];
				whereStr += index == 0 ? ` ${key}=${val}` : ` AND ${key}=${val}`;
			});
		}
		if (conditions['contains'] && conditions['contains'].length != 0) {
			if (whereStr.length > 5) whereStr += ' AND';
			conditions['contains'].forEach((condition, index) => {
				const key = Object.keys(condition)[0];
				const val = condition[key];
				const subKeys = key.split(',');
				const numOfSubKeys = subKeys.length;
				if (numOfSubKeys == 1) {
					whereStr += index == 0 ? ` ${key} LIKE "%${val}%"` : ` AND ${key} LIKE "%${val}%"`;
				} else {
					whereStr += index == 0 ? ' (' : ' AND (';
					subKeys.forEach(
						(subKey, i) => {
							whereStr += i == 0 ? `${subKey} LIKE "%${val}%"` : ` OR ${subKey} LIKE "%${val}%"`;
						}
					);
					whereStr += ')';
				}
			});
		}
		if (conditions['greaterThans'] && conditions['greaterThans'].length != 0) {
			if (whereStr.length > 5) whereStr += ' AND';
			conditions['greaterThans'].forEach((condition, index) => {
				const key = Object.keys(condition)[0];
				const val = condition[key];
				whereStr += index == 0 ? ` ${key}>'${val}'` : ` AND ${key}>'${val}'`;
			});
		}
		if (conditions['lessThans'] && conditions['lessThans'].length != 0) {
			if (whereStr.length > 5) whereStr += ' AND';
			conditions['lessThans'].forEach((condition, index) => {
				const key = Object.keys(condition)[0];
				const val = condition[key];
				whereStr += index == 0 ? ` ${key}<'${val}'` : ` AND ${key}<'${val}'`;
			});
		}

		if (conditions['groupBys'] && conditions['groupBys'].length != 0 && conditions['groupByUnits'] && conditions['groupByUnits'].length != 0) {
			groupByStr += 'GROUP BY';
			conditions['groupBys'].forEach((groupBy, index) => {
				whereStr += whereStr.length > 5 ? ` AND ${groupBy} IS NOT NULL` : ` ${groupBy} IS NOT NULL`;
				conditions['groupByUnits'][index].split(',').forEach(
					(groupByUnit) => {
						if (groupByUnit.length == 0) {
							metric = `${metric}, ${groupBy}`;
							groupByStr += groupByStr.length > 8 ? `, ${groupBy}` : ` ${groupBy}`;
						} else {
							metric = `${metric}, ${groupByUnit}(${groupBy})`;
							groupByStr += groupByStr.length > 8 ? `, ${groupByUnit}(${groupBy})` : ` ${groupByUnit}(${groupBy})`;
						}
					}
				);
			});
		}
	}

	if (options && Object.keys(options).length > 0) {
		if (options['sort']) {
			orderByStr += 'ORDER BY';
			const numOfOrderBys = Object.keys(options['sort']).length;
			Object.keys(options['sort']).forEach((key, index) => {
				var val = options['sort'][key] == 1 ? 'ASC' : 'DESC';
				orderByStr += index == numOfOrderBys - 1 ? ` ${key} ${val}` : ` ${key} ${val},`;
			});
		}

		if (options['skip'] || options['limit']) limitStr += 'LIMIT';

		if (options['skip']) limitStr += ` ${options['skip']},`;

		if (options['limit']) limitStr += ` ${options['limit']}`;
	}

	selectStr = `SELECT ${metric} FROM ${subject['tableName']}`;

	queryStr += selectStr;

	if (whereStr.length > 0) queryStr += ` ${whereStr}`;
	if (groupByStr.length > 0) queryStr += ` ${groupByStr}`;
	if (orderByStr.length > 0) queryStr += ` ${orderByStr}`;
	if (limitStr.length > 0) queryStr += ` ${limitStr}`;

	const result = await query(queryStr).catch(err => { console.log(err); });

	return result ? result : [];
}
