const userService = require('../service/user-service');

module.exports.registerUser = async function (req, res) {
    if (req.body) {
        await userService.saveUser(req.body);
        const user = (await userService.getUser({ 'filterBy': 'userId', 'filterByValue': `${req.body['userId']}` }))[0];
        await userService.assignRoles(user);
        const emailNotificationEndpoint = process.env['EMAIL_NOTIFICATION_ENDPOINT_REGISTER'];
        await userService.notifyUser(emailNotificationEndpoint, user);
        res.json({ 'status': 200 });
    }
}

module.exports.getUser = async function (req, res) {
    if (req.query) {
        res.json(await userService.getUser(req.query));
    }
}