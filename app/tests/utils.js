const baseUrl = process.env.ELECTRON_BASE_URL || "http://127.0.0.1:3456"

const Site = {
    "localhost_8173":"http://localhost:8173/",
    "myip":"https://api.myip.com",
    "tiktok":"https://www.tiktok.com/en/",
    "youtube":"https://www.youtube.com/",
    "douyin":"https://www.douyin.com/",
    "xiaohongshu":"https://www.xiaohongshu.com/",
    "chatgpt":"https://www.chatgpt.com/",
    "gemini":"https://gemini.google.com/",
    "codespace":"https://automatic-invention-7v66r6vwvwj7fwwqq.github.dev/",
    "cloudshell":"https://shell.cloud.google.com/?hl=zh_CN&theme=system&fromcloudshell=true&show=ide%2Cterminal"
}
const post_rpc = async ({method,params})=>{
    const res = await fetch(`${baseUrl}/rpc`,{
        method:"POST",
        headers: {
            "Content-Type": "application/json"
        },
        body:JSON.stringify({method,params})
    })
    const body = await res.json()

    return body
}

function openWindow(url,options){
    return  post_rpc({
        method:"openWindow",
        params:{
            "url":url||"https://www.tiktok.com/en/",
            options:{
                width:1024,
                height:768,
                webPreferences: {
                    webviewTag: true,
                    // nodeIntegration: true,
                    // contextIsolation: false,
                    ...options?.webPreferences
                }

            },
            others:{
                // openDevtools:{mode:"right"},
                // userAgent:"Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36",
            }
        }
    })

}

const loadURL =async (url,win_id)=>{
    return post_rpc({
        method:"loadURL",
        params:{
            win_id:win_id||1,
            url:url
        }
    })
}

module.exports = {Site, post_rpc,openWindow,loadURL };
