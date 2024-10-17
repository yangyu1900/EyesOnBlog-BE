const blogService = require('../service/blog-service');

module.exports.getBlog = async function (req, res) {
    if (req.query) {
        const results = await blogService.getBlog(req.query);
        res.json(results);
    }
}