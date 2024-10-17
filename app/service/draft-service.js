const db = require('../model/db');
const DBHelper = require('../util/db-helper');

module.exports.getDraft = async function (queryStr) {
    const parsedQuery = DBHelper.parseQuery('draft', queryStr);
    return await db.find(parsedQuery['subject'], parsedQuery['conditions'], parsedQuery['options']);
}

module.exports.saveDraft = async function (draft) {
    await db.upsertOne('draft', draft);
}