const db = require('../model/db');
const rp = require('request-promise-native');
const podService = require('./pod-service');
const DBHelper = require('../util/db-helper');

module.exports.getUser = async function (queryStr) {
    const parsedQuery = DBHelper.parseQuery('user', queryStr);
    return await db.find(parsedQuery['subject'], parsedQuery['conditions'], parsedQuery['options']);
}

module.exports.saveUser = async function (user) {
    await db.upsertOne('user', user);
}

module.exports.notifyUser = async function (emailNotificationEndpoint, user) {
    const option = {
        method: 'POST',
        uri: emailNotificationEndpoint,
        headers: {
            'content-type': 'application/json'
        },
        body: user,
        json: true,
        resolveWithFullResponse: true
    };
    await rp(option).catch(err => { console.log(err); });
}

module.exports.assignRoles = async function (user) {
    const pod = (await podService.getPod({ 'filterBy': 'podId', 'filterByValue': `${user.podId}` }))[0];
    const cookieRetrieveEndpoint = pod.blogChannelUrl;
    const cookieJar = await this.getCookieStr(cookieRetrieveEndpoint);
    const tidRetrieveEndpoint = process.env['TID_RETRIEVE_ENDPOINT'];
    const tid = await this.getTid(tidRetrieveEndpoint, cookieJar);
    const roleManagementEndpoint = process.env['ROLE_MANAGEMENT_ENDPOINT'];
    pod.roleIds.split(',').forEach(async (roleId) => await this.addRole(roleManagementEndpoint, tid, cookieJar, roleId, user.userId));
}

module.exports.getCookieStr = async function (cookieRetrieveEndpoint) {
    var cookieJar = rp.jar();
    const options = {
        method: 'GET',
        uri: cookieRetrieveEndpoint,
        header: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'sec-ch-ua': '\'Google Chrome\';v=\'95\', \'Chromium\';v=\'95\', \';Not A Brand\';v=\'99\'',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36',
            'sec-ch-ua-platform': '\'Windows\'',
            'sec-ch-ua-mobile': '?0',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-User': '?1',
            'Sec-Fetch-Dest': 'document'
        },
        resolveWithFullResponse: true,
        jar: cookieJar
    };
    await rp(options).catch(err => { console.log(err); });
    return cookieJar;
}

module.exports.getTid = async function (tidRetrieveEndpoint, cookieJar) {
    var tid = '';
    const options = {
        method: 'GET',
        uri: tidRetrieveEndpoint,
        header: {
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
            'Accept-Encoding': 'gzip, deflate, br',
            'sec-ch-ua': '\'Google Chrome\';v=\'95\', \'Chromium\';v=\'95\', \';Not A Brand\';v=\'99\'',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36',
            'sec-ch-ua-platform': '\'Windows\'',
            'sec-ch-ua-mobile': '?0',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Site': 'same-origin',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-User': '?1'
        },
        resolveWithFullResponse: true,
        jar: cookieJar
    };
    const response = await rp(options).catch(err => { console.log(err); });
    response.body.split('\n').forEach((str) => {
        if (str.trim().startsWith('var addFollwerEndpoint = ')) tid = str.substring(str.lastIndexOf('=') + 1, str.lastIndexOf('\''));
    })
    return tid;
}

module.exports.addRole = async function (roleManagementEndpoint, tid, cookieJar, roleId, userId) {
    const options = {
        method: 'POST',
        uri: `${roleManagementEndpoint}?tid=${tid}`,
        header: {
            'Content-Type': 'application/x-www-form-urlencoded; charset=UTF-8',
            'Accept': 'application/json, text/javascript, */*; q=0.01',
            'Accept-Encoding': 'gzip, deflate, br',
            'X-Requested-With': 'XMLHttpRequest',
            'sec-ch-ua': '\'Google Chrome\';v=\'95\', \'Chromium\';v=\'95\', \';Not A Brand\';v=\'99\'',
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; WOW64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.69 Safari/537.36',
            'sec-ch-ua-platform': '\'Windows\'',
            'Sec-Fetch-Site': 'same-origin',
            'Sec-Fetch-Mode': 'cors',
            'Sec-Fetch-Dest': 'empty'
        },
        form: {
            'actionType': 'addRole',
            'roleId': `${roleId}`,
            'userId': `${userId}`
        },
        resolveWithFullResponse: true,
        jar: cookieJar
    };

    await rp(options).catch(err => { console.log(err); });
}





