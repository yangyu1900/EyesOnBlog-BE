const db = require('../model/db');
const blogService = require('./blog-service');

module.exports.getAnalytics = async function (queryStr) {
    return await blogService.getBlog(queryStr);
}


