const statsService = require('../service/stats-service');
const podService = require('../service/pod-service');

module.exports.syncStats = async function () {
    const pods = await podService.getPod({});
    pods.forEach(async (pod) => await statsService.syncStats(pod));
}