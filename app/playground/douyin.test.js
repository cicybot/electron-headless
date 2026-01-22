// -*- coding: utf-8 -*-
const fs = require('fs')
const path = require('path')
const {
    whisperTranscribe,
    chatgptAsk,
    downloadMedia,getRequests,getWindowState,getHtmlPageInfo,waitForResult,
    clearRequests,executeJavaScript, loadURL, post_rpc, Site
} = require('../src/utils')

jest.setTimeout(900000); // 30 seconds

describe('douyin', () => {
    /**
     * 
https://v3-dy-o.zjcdn.com/43d0ba71d684114ba92d60e15a2e1961/695d3174/video/tos/cn/tos-cn-ve-15/ocag5pCbiudeAikASADIAgACOJAHB1B2Agzf9r/media-audio-und-mp4a/?a=6383&ch=0&cr=8&dr=0&er=1&lr=default&cd=0%7C0%7C0%7C3&cv=1&br=189&bt=189&cs=4&mime_type=video_mp4&qs=0&rc=NTY6aDxkZjk7MzZkNjU4ZkBpamU8anA5cjd3NzMzNGkzM0BiNi82NmBiM2FgMWMtX2AuYSNuMmdhMmRzbWNhLS1kLTBzcw%3D%3D&btag=c0000e00030000&cc=1f&cquery=100o_100w&dy_q=1767628468&l=202601052354279F83C6A7659E037B956E&req_cdn_type=
https://v5-dy-o-abtest.zjcdn.com/5f15201372a4ee9e559fc60b5187ee55/695d3174/video/tos/cn/tos-cn-ve-15/ocag5pCbiudeAikASADIAgACOJAHB1B2Agzf9r/media-video-hvc1/?a=6383&ch=0&cr=8&dr=0&er=1&lr=default&cd=0%7C0%7C0%7C3&cv=1&br=1006&bt=1006&cs=4&ds=4&mime_type=video_mp4&qs=0&rc=NjNlZTs3Njc1NjY2NDQzZkBpamU8anA5cjd3NzMzNGkzM0AuYDY1Y2AwNi8xLjVjYS9iYSNuMmdhMmRzbWNhLS1kLTBzcw%3D%3D&btag=c0000e00030000&cquery=100o_100w&dy_q=1767628468&l=202601052354279F83C6A7659E037B956E
     */
    it('douyin_getRequests', async () => {
        const res = await post_rpc({
            method: "getRequests",
            params: {
                win_id: 1
            }
        })
        const { result } = res
        fs.writeFileSync("/tmp/test.json", JSON.stringify(result, null, 2))
        const rows = result.filter(row => row.win_id === 1)
        const rows1 = rows.find(row => row.url.indexOf("__vid") > -1)

        console.log(rows1)
    });
    it('douyin_downloadMedia', async () => {
        const res = await post_rpc({
            method: "downloadMedia",
            params: {
                win_id: 1,
                // mediaUrl: "https://github.com/Azure-Samples/cognitive-services-speech-sdk/raw/master/samples/cpp/windows/console/samples/enrollment_audio_katie.wav"
                mediaUrl: "https://v5-dy-o-abtest.zjcdn.com/6fe18577f7e2fe83233c88770b0cacf3/695f66ee/video/tos/cn/tos-cn-ve-15/oEA3ftIItffeJtq9mpDYPAEHYeE4APwKki6mg3/?a=6383&ch=26&cr=13&dr=0&lr=all&cd=0%7C0%7C0%7C&cv=1&br=1002&bt=1002&cs=0&ds=3&ft=CZdgCYlIDyjNb~VQ9wESkYShd.Mx_CD03-ApQX&mime_type=video_mp4&qs=1&rc=OmRkO2U2aGY2OGc0ZTs2PEBpamU8anA5cjd3NzMzNGkzM0AzLl8uYTQ1XjAxYGI1Xi0tYSNuMmdhMmRzbWNhLS1kLTBzcw%3D%3D&btag=80000e00030000&cquery=100o_100w_100B_100H_100K&dy_q=1767848830&feature_id=0ea98fd3bdc3c6c14a3d0804cc272721&l=20260108130710FA1E26545150645F2A86&__vid=7575015889800531200"
            }
        })
        const { result } = res

        console.log(result)
    });


    it('setAutoRunJs', async () => {
        const code = btoa(`
        setTimeout(()=>{
            document.querySelectorAll('div[id^="login-full-panel-"]').forEach(el => el.remove());
        },5000)
        `)
        console.log(atob(code))
        const res = await post_rpc({
            method: "executeJavaScript",
            params: {
                win_id: 1,
                code:`window._G.setAutoRunJs('${code}')`
            }
        })
        const { result } = res
        console.log(result)
    });
});

describe('douyin_download_media', () => {
    it('douyin_download_media_1', async () => {
        const win_id = 1
        const url = "https://www.iesdouyin.com/share/video/7587813885127675170/?region=MM&mid=7587814028857428782&u_code=0&did=MS4wLjABAAAAKXydf-VF2RF5LMMa4urzfLMdHe32vAou0R2zW9q7F8c&iid=MS4wLjABAAAAOHilHzUkHEdgsUgyHau0H46IS_Pyptyv4FBkSMZ41P10LJqzP2n3djsVFosgIzBP&with_sec_did=1&video_share_track_ver=&titleType=title&share_sign=3AyRpityR0vsxSwb.VWOVtyQjbngPEpxUjuqstFekpk-&share_version=370200&ts=1767525397&from_aid=1128&from_ssr=1&share_track_info=%7B%22link_description_type%22%3A%22%22%7D&utm_source=copy&utm_campaign=client_share&utm_medium=android&app=aweme&ug_share_id=351617074140a_1767526995591&activity_info=%7B%22social_author_id%22%3A%22187339677370211%22%2C%22social_share_id%22%3A%22a29360d8-ed6d-4b12-ac1f-babbd8694d7c%22%2C%22social_share_time%22%3A%221767526995%22%2C%22social_share_user_id%22%3A%220%22%7D&share_extra_params=%7B%22schema_type%22%3A%221%22%7D"
        try {
            await loadURL(url,win_id)
            await clearRequests()
            await waitForResult(async ()=>{
                const res = await getWindowState(win_id)
                return res.result.ready;
            },-1,1000)

            const pageInfo  = await waitForResult(async ()=>{
                const res = await  getHtmlPageInfo()
                if(res.result.title){
                    return res.result;
                }else{
                    return false
                }
            },-1,1000)

            const video = await waitForResult(async ()=>{
                const res = await getRequests(win_id)
                const {result}= res
                const row = result.find(row => row.url.indexOf("__vid") > -1);
                if(row){
                    return row;
                }else{
                    return false
                }
            },-1,1000)
            if(!video.err){
                const {url:mediaUrl} = video
                const {url} = pageInfo
                const videoId = url.replace("https://www.douyin.com/video/","")
                const downloadMediaRes = await downloadMedia({
                    mediaUrl,
                    id:videoId,
                    basePath:"douyin",
                    genSubtitles:false
                },win_id)
                console.log("downloadMediaRes",downloadMediaRes)
                const {result} = downloadMediaRes
                const infoPath = result.audioPath.replace(".mp3",".json")
                const subtitlePath = result.audioPath.replace(".mp3",".sbt.json")

                const info = {
                    fetchTime:pageInfo.t,
                    title:pageInfo.title,
                    url:pageInfo.url,
                    html:pageInfo.html,
                    media:{
                        ...result,
                        subtitlePath,
                    }
                }
                console.log(info)
                fs.writeFileSync(infoPath,JSON.stringify(info,null,2))
            }else{
                console.error("failed get video")
            }
        }catch (e) {
            console.log(e)
        }
    });

    it('gen_subtitles', async () => {

        const ROOT_DIR = "/Users/ton/assets/douyin"
        async function processVideo(videoId) {
            const videoDir = path.join(ROOT_DIR, videoId);
            const subtitlePath = path.join(videoDir, `${videoId}.sbt.json`);
            const mp3Path = path.join(videoDir, `${videoId}.mp3`);

            // 如果字幕已存在，直接退出
            if (fs.existsSync(subtitlePath)) {
                console.log(`[SKIP] ${subtitlePath} exists`);
                return;
            }

            // mp3 必须存在
            if (!fs.existsSync(mp3Path)) {
                console.warn(`[WARN] mp3 not found: ${mp3Path}`);
                return;
            }

            console.log(`[RUN] whisper transcribe: ${videoId}`);

            const result = await whisperTranscribe(mp3Path);

            fs.writeFileSync(
                subtitlePath,
                JSON.stringify(result, null, 2),
                "utf-8"
            );

            console.log(`[OK] subtitle written: ${subtitlePath}`);
        }

        async function main() {
            const dirs = fs
                .readdirSync(ROOT_DIR, { withFileTypes: true })
                .filter(d => d.isDirectory())
                .map(d => d.name);
            console.log(dirs)
            for (const videoId of dirs) {
                await processVideo(videoId);
            }
        }

        await main()
    });

    it('pare page info', async () => {

        const ROOT_DIR = "/Users/ton/assets/douyin"
        async function processPageInfo(videoId) {
            const videoDir = path.join(ROOT_DIR, videoId);
            const infoPath = path.join(videoDir, `${videoId}.info.json`);
            const mainPath = path.join(videoDir, `${videoId}.json`);

            // if (fs.existsSync(infoPath)) {
            //     console.log(`[SKIP] ${infoPath} exists`);
            //     return;
            // }

            if (!fs.existsSync(mainPath)) {
                console.warn(`[WARN] not found: ${mainPath}`);
                return;
            }
            const mainInfo = JSON.parse(fs.readFileSync(mainPath).toString())
            const {html} = mainInfo
            console.log(`[RUN] ask chatgpt page info: ${videoId}`);

            const result = await chatgptAsk(`
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
  "title": string | null,//视频标题
  "author": string | null,//博主
  "keywords": string | null,//关键词
  "publishDate": string | null,//发布时间
  "likeCount": number | string | null,//点赞数
  "commentCount": number | null,//评论数
  "favorCount": number | null,//收藏数
  "forwardCount": number | null,//转发数
  "fansCount": number | string | null,//粉丝数
  "likeTotalCount": number | string | null,//总获赞数
  "comments": [//评论列表
    {
      "user": string,
      "text": string,
      "time": string | null
    }
  ],
  "tideOfOpinion": string | null,//评论区风向
  "coreCase": string | null//内容要点
}

【任务】
从下面 HTML 中抽取信息，并严格按上述 JSON 结构输出。

【HTML】
${html}
`);

            fs.writeFileSync(
                infoPath,
                JSON.stringify(JSON.parse(result[0].text), null, 2),
                "utf-8"
            );

            console.log(`[OK] written: ${infoPath}`);
        }

        async function main() {
            const dirs = fs
                .readdirSync(ROOT_DIR, { withFileTypes: true })
                .filter(d => d.isDirectory())
                .map(d => d.name);
            console.log(dirs)
            for (const videoId of dirs) {
                await processPageInfo(videoId);
            }
        }

        await main()
    });
})
