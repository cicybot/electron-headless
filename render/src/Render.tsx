
import { useEffect, useRef, useState } from "react";
import View from "./View"
import { WindowDetail } from "./WindowDetail"
import { DesktopDetail } from "./DesktopDetail"
import { RpcProvider } from "./RpcContext"

const baseUrl = "http://127.0.0.1:3456"

const post_rpc = async ({ method, params }: any) => {
    const res = await fetch(`${baseUrl}/rpc`, {
        method: "POST",
        headers: {
            "Content-Type": "application/json"
        },
        body: JSON.stringify({ method, params })
    })
    const body = await res.json()

    return body
}
function Render() {
    const [mediaUrl, setMediaUrl] = useState("")
    const [mediaInfo, setMediaInfo] = useState<any>(null)
    const [comments, setComments] = useState<any>(null)
    const [title, setTitle] = useState("")
    const [currentUrl, setCurrentUrl] = useState("")
    
    // Parse URL parameters for win_id
    const uri = new URL(location.href)
    const desktop = uri.searchParams.get("desktop")
    const winId = uri.searchParams.get("win_id")
    const url = uri.searchParams.get("u")!
    if(desktop){
        return (
            <RpcProvider>
                <DesktopDetail
                    onBack={() => window.close()}
                />
            </RpcProvider>
        )
    }
    // If win_id is present, show WindowDetail component
    if (winId) {
        const initialUrl = uri.searchParams.get("url") || ""
        return (
            <RpcProvider>
                <WindowDetail 
                    windowId={parseInt(winId)} 
                    initialUrl={initialUrl} 
                    onBack={() => window.close()} 
                />
            </RpcProvider>
        )
    }
    
    //@ts-ignore
    window.onMessage = ({ action, payload }: any) => {
        console.log("onMessage", action, payload)
        switch (action) {
            case "onMedia":
                const { mediaUrl } = payload
                setMediaUrl(mediaUrl)
                break
        }

    }
    const webviewTag = useRef<null | any>(null)
    const [webContentsId, setWebContentId] = useState(null)
    useEffect(() => {
        if (!webviewTag.current) {
            return
        }
        const webview = webviewTag.current
        webview.addEventListener('dom-ready', () => {
            setWebContentId(webview.getWebContentsId())
            setTitle(webview.getTitle())
            setCurrentUrl(webview.getURL())
        })

        webview.addEventListener('page-title-updated', ({ title }: any) => {
            setTitle(title)
        })
    }, [webviewTag]);
    const sideWidth = 300
    return (
        <View w100vw h100vh relative>
            <View absFull right={sideWidth}>
                <webview ref={webviewTag} partition={"persist:p_0"} style={{ width: "100%", height: "100%" }}
                    src={url} ></webview>

            </View>
            <View abs top0 bottom0 right0 w={sideWidth} p12 borderBox overflowYAuto>
                <View w100p>
                    <View json={{
                        mediaInfo,
                        webContentsId, mediaUrl,
                        currentUrl, title,
                        comments
                    }}></View>
                </View>
                <View mb12 rowVCenter>
                    <button onClick={async () => {
                        const res = await post_rpc({
                            method: "executeJavaScript",
                            params: {
                                code: `
(()=>{


  const el = document.querySelector(".comment-mainContent")
    
  const items = el.querySelectorAll('[data-e2e="comment-item"]');

  const result = [];

 function cleanCommentText(rawText) {
  return rawText
    // replace multiple types of line breaks with a single space
    .replace(/\\r?\\n/g, " ")
    .replace(/\\b(展开|回复|分享|…)\\b/g, "")
    // collapse multiple spaces into one
    .replace(/\\s+/g, " ")
    // trim start/end
    .trim();
}
  items.forEach(item => {

    const text= cleanCommentText(item.innerText)
    result.push({ text});
  });
  return result;
})()
`,
                                wc_id: webContentsId
                            }
                        })
                        console.log(res.result)
                        setComments({
                            ts: Date.now(),
                            comments: res.result
                        })
                    }}>GetComments</button>

                    <View w12 />
                    <button onClick={() => {
                        //document.querySelector(".comment-mainContent")
                        post_rpc({
                            method: "executeJavaScript",
                            params: {
                                code: `
document.querySelectorAll('div[id^="login-full-panel-"]').forEach(el => el.remove());
`,
                                wc_id: webContentsId
                            }
                        })
                    }}>ClearLogin</button>
                </View>
                <View rowVCenter>
                    <button onClick={() => {
                        post_rpc({
                            method: "openDevTools",
                            params: {
                                wc_id: webContentsId
                            }
                        })
                    }}>DevTools</button>
                    <View w12 />


                    <View>
                        <button onClick={async () => {
                            const { result } = await post_rpc({
                                method: "downloadMedia1",
                                params: {

                                }
                            })
                        }}>FetchVideo1sss</button>
                    </View>
                    s
                    <View w12 />
                    <View hide={!mediaUrl}>
                        <button onClick={async () => {
                            const { result } = await post_rpc({
                                method: "downloadMedia",
                                params: {
                                    mediaUrl,
                                    name: "douyin/" + title.substring(0, 10),
                                    title,
                                    url: currentUrl,
                                    ext: "mp4",
                                    showWin: true
                                }
                            })
                            setMediaInfo(result)
                        }}>FetchVideo</button>
                    </View>

                    <View w12 />
                    <View >

                        <button onClick={async () => {
                            await post_rpc({
                                method: "getSubTitles",
                                params: {
                                    // videoPath:mediaInfo.filePathMedia,
                                    // outputPath:mediaInfo.filePathMedia.split(".")[0]+".mp3"
                                }
                            })


                        }}>SubTitles</button>
                    </View>
                </View>
                <View>
                    <audio id="player" src="http://127.0.0.1:3456/assets/douyin/AI%E5%8D%96%E8%A2%9C%E7%8B%82%E8%B5%9A271%E4%B8%87.mp3" controls></audio>
                    <button onClick={() => {
                        //start 
                    }}></button>
                    <div id="result"></div>

                </View>
            </View>
        </View>
    )
}

export { Render } 
