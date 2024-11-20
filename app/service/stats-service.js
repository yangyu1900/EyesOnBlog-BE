const rp = require('request-promise-native');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const userService = require('./user-service');
const draftService = require('./draft-service');
const blogService = require('./blog-service');

module.exports.syncStats = async function (pod) {
    console.log(`syncing at ${new Date().toISOString()}`);

    const baseUrl= process.env['BLOG_BASE_URL'];
    const option = {
        method: 'GET',
        uri: pod.blogChannelUrl,
        resolveWithFullResponse: true
    }
    const response = await rp(option);

    const virtualConsole = new jsdom.VirtualConsole();
    const dom = new JSDOM(`${response.body}`, { virtualConsole });

    const blogElements = dom.window.document.getElementsByClassName('MessageViewCard_lia-message__6_xUN');

    for (let blogElement of blogElements) {
        const titleElement = blogElement.getElementsByClassName('MessageViewCard_lia-subject-link__OhaPD')[0];
        const title = titleElement.getAttribute('aria-label');
        const blogUrl = baseUrl + titleElement.getAttribute('href');
        const blogId = Number.parseInt(blogUrl.split('/').at(-1));

        const authorElement = blogElement.getElementsByClassName('MessageViewCard_lia-byline-item__5soD1')[0];
        const authorLinkArr = authorElement.getAttribute('href').split('/');
        const authorName = decodeURI(authorLinkArr.at(-2));
        const authorId = Number.parseInt(authorLinkArr.at(-1));

        const publishDateElement = blogElement.getElementsByClassName('MessageViewCard_lia-timestamp__pG_bu')[0].getElementsByTagName('span')[0].getElementsByTagName('span')[0];
        const publishDateStr = publishDateElement.getAttribute('title').replace('at', ',');
        const publishDate = new Date(Date.parse(publishDateStr)).toISOString();

        const pageviewElement = blogElement.getElementsByClassName('styles_lia-g-count-wrap___e35P')[0];
        const pageview = pageviewElement.textContent.indexOf('K') > -1 ? Number.parseFloat(pageviewElement.textContent.replace('K', '')) * 1000 : Number.parseInt(pageviewElement.textContent.replace(',', ''));

        try {
            const userSet = await userService.getUser({ 'filterBy': 'userId', 'filterByValue': `${authorId}` });

            const user = userSet.length > 0 ? userSet[0] : {
                userId: authorId,
                userName: authorName,
                podId: pod.podId,
                podName: pod.podName,
                roles: 'author',
                reviewCount: 0,
            };

            if (userSet.length == 0) await userService.saveUser(user);

            const draftSet = await draftService.getDraft({ 'filterBy': 'title', 'filterByValue': `'${title}'` });
            const draft = draftSet.length > 0 ? draftSet[0] : { title: title };

            const verticals = pod.verticals.split(',');        

            const blogSet = await blogService.getBlog({ 'filterBy': 'blogId', 'filterByValue': `${blogId}` });
            var vertical = blogSet.length > 0 ? blogSet[0]['vertical'] : undefined;

            if (!(blogSet.length > 0 && blogSet[0]['vertical'])) {
                if (draft['vertical']) {
                    vertical = draft['vertical'];
                } else if (user['verticals']) {
                    vertical = user['verticals'].split(',')[0];
                } else {
                    const gptRequestOption = {
                        method: 'POST',
                        uri: process.env['GPT_ENDPOINT'],
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify([{
                            role: 'user',
                            content: `Given a blog of ${pod.podName} is titled '${title}' and ${pod.podName} has ${verticals.length} verticals, ${pod.verticals}, pick 1 of above ${verticals.length} verticals that best categorizes the blog? Give me minimum required answer.`
                        }]),
                        resolveWithFullResponse: true
                    };
                    const answer = await rp(gptRequestOption).catch(err => { console.log(err); });
                    if (answer['statusCode'] == 200) {
                        const ans = JSON.parse(answer['body'])['content'];
                        for (const v of verticals) {
                            if (ans.toLowerCase().indexOf(v.toLowerCase()) > -1) {
                                vertical = v;
                                break;
                            }
                        }
                        if (!vertical) {
                            console.log(gptRequestOption)
                            console.log(verticals)
                            console.log(ans)
                        }
                    }
                }
            }
            const blog = {
                blogId: blogId,
                title: title,
                url: blogUrl,
                publishDate: publishDate,
                pageview: pageview,
                podId: pod.podId,
                podName: pod.podName,
                vertical: vertical,
                authorId: authorId,
                authorName: authorName
            }
            await blogService.saveOrUpdateBlog(blog);
        } catch (error) {
            console.log(option.uri);
            console.log(authorName);
            console.log(authorId);
            console.log(error);
        }
    }
}