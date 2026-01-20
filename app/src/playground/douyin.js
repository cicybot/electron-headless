const utils = require("../utils");
const {getRequests, chatgptAsk} = require("../utils");
const {Storage, getCleanHtml, regxHTML1} = require("../utils-browser");

function parseMeta() {
    const metas = document.querySelectorAll('meta[data-rh="true"]');
    const result = {};

    metas.forEach(meta => {
        const name = meta.getAttribute('name');
        const content = meta.getAttribute('content');
        if (name && content) {
            result[name] = content;
        }
    });

    return result;
}

async function parseHtml() {
    // 调用解析函数
    const metaData = parseMeta();
    const {description, keywords} = metaData
    const video_cover_image_url = metaData['lark:url:video_cover_image_url']
    const video_title = metaData['lark:url:video_title']

    let videoInfoHtml = ""
    const ele = document.querySelector(".bm6Yr1Fm")
    if (ele) {
        videoInfoHtml = getCleanHtml(ele)
    }

    let authorInfoHtml = ""
    const ele1 = document.querySelector(".cHwSTMd3")
    if (ele1) {
        authorInfoHtml = getCleanHtml(ele1)
    }

    const ele2 = document.querySelector(".comment-mainContent")
    let commentsHtml = ""
    if (ele2) {
        commentsHtml = regxHTML1(getCleanHtml(ele2))
    }
    const url = location.href
    const videoId = url.replace("https://www.douyin.com/video/", "")
    const prompt = `
你是一个“JSON 解析器”，不是聊天助手。

【强制输出规则】
1. 你的回复【只能】是一个合法的 JSON 对象
2. 不允许出现 Markdown、\`\`\`、说明文字、注释、解释、换行前后多余字符
3. 不允许出现除 JSON 以外的任何内容
4. 所有字段必须存在
5. 如果字段在 HTML 中无法确定，值必须为 null
6. 字段类型必须严格遵守下面定义
7. 输出不符合以上任一规则即为错误

【JSON 结构定义】
{
  
  "author":{
      "name":  string | null,//author name
      "fansCount": number | string | null,//vlog 粉丝数
      "likeTotalCount": number | string | null,//vlog 总获赞数
  },
  "video":{
      "publishDate": string | null,//video 发布时间
      "likeCount": number | string | null,//video 点赞数
      "commentCount": number | null,//video 评论数
      "favorCount": number | null,//video 收藏数
      "forwardCount": number | null,//video 转发数
  },
  "comments": [//评论列表
    {
      "user": string,
      "text": string,
      "time": string | null
    }
  ]
}

【任务】
从下面 HTML 中抽取信息，并严格按上述 JSON 结构输出。

【HTML】
作者html片段
${authorInfoHtml}

视频html片段
${videoInfoHtml}

评论html片段
${commentsHtml}
`
    let aiParseInfo = null
    try {

        const res1 = await chatgptAsk(prompt);
        if (res1 && res1.length > 0) {
            aiParseInfo = JSON.parse(res1[0].text)
        }
    } catch (e) {
        console.log(e)
    }

    const res = {
        time: Date.now(),
        id: videoId,
        url,
        aiParseInfo,
        page: {
            title: document.title,
            description, keywords,
        },
        html: {
            videoInfo: videoInfoHtml,
            authorInfo: authorInfoHtml,
            comments: commentsHtml
        },
        video: {
            title: video_title,
            thumb: video_cover_image_url
        }
    }
    Storage.set("_video_" + videoId, res)
    return res
}

const main = async ({win_id}) => {
    parseHtml()
    const {waitForResult, getSubTitles, downloadMedia} = utils

    const video = await waitForResult(async () => {
        const res = await getRequests(win_id)
        const {result} = res
        const row = result.find(row => row.url.indexOf("__vid") > -1);
        if (row) {
            return row;
        } else {
            return false
        }
    }, -1, 1000)

    if (video) {
        const {url: mediaUrl} = video
        d("got mediaUrl:", mediaUrl)

        const videoId = location.href.replace("https://www.douyin.com/video/", "")
        const downloadMediaRes = await downloadMedia({
            mediaUrl,
            id: videoId,
            basePath: "douyin",
            genSubtitles: false
        }, win_id)
        const {result} = downloadMediaRes
        const {audioPath} = result
        d("audioPath", audioPath)
        // let subTitles = Storage.get("subTitles_"+videoId)
        // if(!subTitles){
        //     d("fetch subTitles")
        //     const subTitlesRes = await getSubTitles({mediaPath:audioPath})
        //     subTitles = subTitlesRes.result
        //     Storage.set("subTitles_"+videoId,subTitles)
        // }
        // d("subTitles",subTitles)
    } else {
        d("[ERR] fetch error video:")
    }
}

// prompt-textarea
module.exports = {main}