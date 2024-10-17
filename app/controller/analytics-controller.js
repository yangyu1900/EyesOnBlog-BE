const analyticsService = require('../service/analytics-service');

module.exports.getAnalytics = async function (req, res) {
    if (req.query) {
        res.json(await analyticsService.getAnalytics(req.query));
    }
}
