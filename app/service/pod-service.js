const db = require('../model/db');
const DBHelper = require('../util/db-helper');

module.exports.getPod = async function (queryStr) {
    const parsedQuery = DBHelper.parseQuery('pod', queryStr);
    return await db.find(parsedQuery['subject'], parsedQuery['conditions'], parsedQuery['options']);
}

