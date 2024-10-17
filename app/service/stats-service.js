const rp = require('request-promise-native');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
const userService = require('./user-service');
const draftService = require('./draft-service');
const blogService = require('./blog-service');

module.exports.syncStats = async function (pod) {
    console.log(`syncing at ${new Date().toISOString()}`)
    var pageNum = 1;
    var baseUrl = process.env['BLOG_BASE_URL'];

    while (true) {
        const option = {
            method: 'GET',
            uri: pageNum == 1 ? pod.blogChannelUrl : pod.blogChannelUrl + '/page/' + pageNum,
            resolveWithFullResponse: true
        }
        const response = await rp(option);
        if (response.request.href.endsWith('/page/' + (pageNum - 1)))
            return;

        const dom = new JSDOM(`${response.body}`);
        const blogElements = dom.window.document.getElementsByClassName('lia-quilt-column-main');

        for (let blogElement of blogElements) {
            const authorDetailsElement = blogElement.getElementsByClassName('lia-quilt-column-alley-single')[0].getElementsByClassName('author-details')[0];
            const authorName = authorDetailsElement.getElementsByTagName('a')[0].textContent;
            const authorLinkArr = authorDetailsElement.getElementsByTagName('a')[0].getAttribute('href').split('/');
            const authorId = Number.parseInt(authorLinkArr[authorLinkArr.length - 1]);

            const publishDateStr = authorDetailsElement.getElementsByClassName('post-time-text')[1].textContent;
            const publishDate = new Date(Date.parse(publishDateStr)).toISOString();

            try {

                const pageLinkElement = blogElement.getElementsByClassName('page-link')[0];
                const pageviewElement = blogElement.getElementsByClassName('views')[0];
                const blogUrl = baseUrl + pageLinkElement.getAttribute('href');
                const blogLinkArr = blogUrl.split('/');
                const title = blogLinkArr[blogLinkArr.length - 3].replaceAll('-', ' ');
                const blogId = Number.parseInt(blogLinkArr[blogLinkArr.length - 1]);
                const pageview = pageviewElement.getElementsByTagName('span')[0].textContent.indexOf('K') > -1 ? Number.parseFloat(pageviewElement.getElementsByTagName('span')[0].textContent.replace('K', '')) * 1000 : Number.parseInt(pageviewElement.getElementsByTagName('span')[0].textContent.replace(',', ''));

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

                const blogSet = await blogService.getBlog({ 'filterBy': 'blogId', 'filterByValue': `${blogId}` });
                var vertical = blogSet.length > 0 ? blogSet[0]['vertical'] : undefined;

                if (!(blogSet.length > 0 && blogSet[0]['vertical'])) {
                    if (draft['vertical']) {
                        vertical = draft['vertical'];
                    } else if (user['verticals']) {
                        vertical = user['verticals'].split(',')[0];
                    } else if (answer['statusCode'] == 200) {
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
        pageNum++;
    }
}