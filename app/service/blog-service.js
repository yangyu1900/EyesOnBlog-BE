const db = require('../model/db');
const DBHelper = require('../util/db-helper');

module.exports.saveOrUpdateBlog = async function (blog) {
    await db.upsertOne('blog', blog);
}

module.exports.getBlog = async function (queryStr) {
    const parsedQuery = DBHelper.parseQuery('blog', queryStr);
    return await db.find(parsedQuery['subject'], parsedQuery['conditions'], parsedQuery['options']);
}

