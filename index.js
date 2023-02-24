const Parser = require('rss-parser');
const axiosBase = require('axios');
const REQUEST = {
    baseUrl: process.env.SLACK_WEBHOOK_BASE_URL,
    uri: process.env.SLACK_WEBHOOK_URI
};
const axios = axiosBase.create({
    baseURL: REQUEST.baseUrl,
    headers: {
        'Content-Type': 'application/json'
    }
})
const parser = new Parser();
const RSS_URL = 'https://azurecomcdn.azureedge.net/en-us/updates/feed?status=nowavailable';
const PAST_DAY = 1;

module.exports = async function (context, myTimer) {

    const feed = await parser.parseURL(RSS_URL);
    context.log(feed.lastBuildDate);
    const lastBuildDate = Date.parse(feed.lastBuildDate);
    const day = 1000 * 60 * 60 * 24;

    const data = feed.items.flatMap(item => {
        const pubDate = Date.parse(item.pubDate);
        if ((lastBuildDate - pubDate) / day < PAST_DAY) {
            return {
                "blocks": [
                    {
                        "type": "section",
                        "text": {
                            "type": "mrkdwn",
                            "text": "*Update* \n" + item.title + "\n" + item.pubDate
                        },
                        "accessory": {
                            "type": "button",
                            "text": {
                                "type": "plain_text",
                                "text": "Click Link",
                                "emoji": true
                            },
                            "value": "click_me_123",
                            "url": item.link,
                            "action_id": "button-action"
                        }
                    }
                ]
            };
        } else {
            return [];
        }
    });

    if (data.length) {
        const res = await Promise.all(data.map(data => {
            const responseData = JSON.stringify(data);
            return axios.post(REQUEST.uri, responseData)
                .catch((err) => {
                    context.log(err);
                });
        }));
    } else {
        context.log(data.length);
        context.log("連携対象外");
    }
};