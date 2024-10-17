const reviewService = require('../service/review-service');

module.exports.requestReview = async function (req, res) {
    if (req.body) {
        await reviewService.requestReview(req.body);
        res.json({ 'status': 200 });
    }
}
