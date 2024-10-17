const podService = require('../service/pod-service');

module.exports.getPod = async function (req, res) {
    if (req.query) {
        res.json(req.query['podId'] ? await podService.getPod({ 'filterBy': 'userId', 'filterByValue': `${req.query['podId']}` }) : await podService.getPod({}));
    }
}
