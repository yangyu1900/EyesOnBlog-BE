const draftService = require('./draft-service');
const userService = require('./user-service');
const rp = require('request-promise-native');

module.exports.requestReview = async function (draft) {
    const draftSet = await draftService.getDraft({ 'filterBy': 'title', 'filterByValue': `'${draft.title}'` })
    if (draftSet.length > 0) return;
    const reviewer = (await this.getReviewer(draft))[0];
    const author = (await userService.getUser({ 'filterBy': 'userId', 'filterByValue': `${draft.authorId}` }))[0];
    const emailNotificationEndpoint = process.env['EMAIL_NOTIFICATION_ENDPOINT_REVIEW'];
    if (reviewer) {
        await this.notifyReviewer(emailNotificationEndpoint, reviewer, author, draft);
        draft.podName = reviewer.podName;
        draft.authorName = author.userName;
        draft.reviewerId = reviewer.userId;
        draft.reviewerName = reviewer.userName;
        draft.submitDate = new Date().toISOString();
        await draftService.saveDraft(draft);
    }
}

module.exports.getReviewer = async function (draft) {
    const result = [];
    const users = await userService.getUser({ 'filterBy': ['podId', 'verticals'], 'filterByValue': [`${draft.podId}`, `'${draft.vertical}'`], 'orderBy': 'reviewCount', 'orderByOrder': '-1', 'limit': '2' });
    users.forEach((user) => {
        if (user.userId != draft.authorId) result.push(user);
    });
    return result;
}

module.exports.addReviewCount = async function (reviewer) {
    reviewer.reviewCount += 1;
    await userService.saveUser(reviewer);
}

module.exports.resetReviewCount = async function () {
    const users = await userService.getUser();
    users.forEach(async (user) => {
        user.reviewCount = 0;
        await userService.saveUser(user);
    });
}

module.exports.notifyReviewer = async function (emailNotificationEndpoint, reviewer, author, draft) {
    const option = {
        method: 'POST',
        uri: emailNotificationEndpoint,
        headers: {
            'content-type': 'application/json'
        },
        body: {
            'reviewer': reviewer,
            'author': author,
            'draft': draft
        },
        json: true,
        resolveWithFullResponse: true
    };
    await rp(option).catch(err => { console.log(err); });
}
