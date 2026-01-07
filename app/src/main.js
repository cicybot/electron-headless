const { app, webContents, BrowserWindow, session, screen } = require('electron');
const cors = require('cors');
const contextMenu = require('electron-context-menu').default || require('electron-context-menu');
const express = require('express');
const path = require('path');
const fs = require('fs');
const serveIndex = require('serve-index'); // 用于生成目录列表
const {openTerminal,getAppInfo,windowSitesToJSON,setCookies} = require("./utils")

const MediaDir = path.join(app.getPath('home'),"assets")

let mainWindow;
let server;
const WindowSites = new Map();
let RequestsMap = [];
const MAX_REQUEST_LOGS = 1000;
let requestIndex = 0;
const isLocal = process.env.IS_LOCAL === "true"
console.log("IS_LOCAL",isLocal,process.env.IS_LOCAL === 'true')
app.setName(process.env.APP_NAME ||"Electron");

async function handleMethod(method, params, { server: { req, res } }) {
    let win;
    let wc;
    if(method !== 'getWindows'){
        console.log("[ACT]", method);
        console.log("[PARAMS]", JSON.stringify(params));
    }
    if (params) {
        if(params.win_id){
            win = BrowserWindow.fromId(params.win_id);
            if (win) {
                wc = win.webContents;
            }
        }
        if(params.wc_id){
            wc = webContents.fromId(params.wc_id)
        }

    }
    let result;
    let ok = true;
    switch (method) {
        case 'ping':
            result = 'pong';
            break;
        case 'getSubTitles': {
            const {videoPath,outputPath}= params
            const path = '/Users/ton/assets/media/douyin/AI卖袜狂赚271万.mp3'
            const audioBuffer = fs.readFileSync(path);

            const response = await fetch("https://api.cicy.de5.net/speech_to_text", {
                method: "POST",
                headers: {
                    "Content-Type": "application/octet-stream",
                },
                body: audioBuffer,
            });
            result = await response.json();
            break;
        }

        case 'downloadMedia1':
        {
            const {session} = mainWindow.webContents
            session.setDownloadPath(MediaDir)
            const {mediaUrl}= params
            const url = "https://v3-dy-o.zjcdn.com/21a9e1d82dbbb17c040a1ca41910381b/695e6db8/video/tos/cn/tos-cn-ve-15/oskPGeZnBIzGRNfvsBSALCJfgb77AzKUhBpcpt/?a=6383&ch=26&cr=13&dr=0&lr=all&cd=0%7C0%7C0%7C&cv=1&br=592&bt=592&cs=0&ds=6&ft=CZdgCYlIDyjNNRVQ9weiKYShd.6HI7103-ApQX&mime_type=video_mp4&qs=12&rc=ZzZmaDkzODhkNWczZzk4ZUBpamU8anA5cjd3NzMzNGkzM0BfNWAwNTZiXzQxNTAwMTZjYSNuMmdhMmRzbWNhLS1kLTBzcw%3D%3D&btag=80000e00030000&cc=1f&cquery=100w_100B_100H_100K_100o&dy_q=1767785032&feature_id=0ea98fd3bdc3c6c14a3d0804cc272721&l=2026010719235158364BC453BB6C01A01A&req_cdn_type=&__vid=7575015889800531200"
            session.on('will-download', (event, item) => {
                const original = item.getFilename();

                const mime = item.getMimeType();
                const ext = path.extname(original);

                const newName = `my_new_name_${Date.now()}${ext}`;
                const url = item.getURL();

                console.log('Download started:');
                console.log('  Filename:', original);
                console.log('  MIME type:', mime);
                console.log('  URL:', url);

                // Set automatic save path
                const savePath = path.join(MediaDir, newName);
                item.setSavePath(savePath);

                // Resume the download
                item.resume();

                // Track progress
                item.on('updated', (event, state) => {
                    if (state === 'progressing') {
                        console.log(`Downloading: ${item.getReceivedBytes()}/${item.getTotalBytes()}`);
                    }
                });

                item.once('done', (event, state) => {
                    if (state === 'completed') {
                        console.log(`Download finished`);
                    } else {
                        console.log(`Download failed: ${state}`);
                    }
                });
            });

            await session.downloadURL(url)
            break
        }
        case 'downloadMedia':
            const {mediaUrl,name,title,url,ext,showWin}= params

            const content = JSON.stringify({
                mediaUrl,title,url
            },null,2)

            const filePathJson = path.join(MediaDir, name+".json");
            const filePathMedia = path.join(MediaDir, name+"."+ext);
            const audioPathAudio = path.join(MediaDir, name+".mp3");
            const dirPath = path.dirname(filePathJson);
            fs.mkdirSync(dirPath, { recursive: true });
            fs.writeFileSync(filePathJson,content)
            const cmd = `ffmpeg -i "${filePathMedia}" -vn -acodec libmp3lame -y "${audioPathAudio}"`;
            openTerminal(`wget ${mediaUrl} -O ${filePathMedia} && ${cmd}`,!!showWin)
            result = {
                MediaDir,
                mediaUrl,name,title,url,ext,showWin,
                filePathJson,
                filePathMedia,
                audioPathAudio
            }
            break
        case 'info':
            const primaryDisplay = screen.getPrimaryDisplay();
            const { width, height } = primaryDisplay.workAreaSize;
            result = {
                process: getAppInfo(),
                screen: { width, height },
            };
            break
        case 'openWindow':
            // Added await here to ensure we get the window object before destructuring
            const winObj = await createWindow(params?.account_index || 0, params?.url, params?.options || {}, params?.others || {});
            result = { id: winObj.id };
            break;
        case 'getRequests':
            if (params && params.win_id) {
                result =  RequestsMap.filter(req => req.win_id === Number(params.win_id));
            }else{
                result =  RequestsMap;
            }

            break
        case 'clearRequests':
            RequestsMap = []
            break;
        case 'getWindows':
            result = windowSitesToJSON(WindowSites);
            break;
        case 'getBounds':
            result = wc ? wc.getBounds() : null;
            break;
        case 'loadURL':
            if (wc) wc.loadURL(params?.url);
            break;
        case 'importCookies':
            if (wc) {
                const { cookies } = params;
                await setCookies(wc, cookies);
            }
            break
        case 'exportCookies':
            if (wc) {
                const { options } = params;
                return await wc.session.cookies.get(options || {});
            }
            break
        case 'executeJavaScript':
            if (wc) {
                const { code } = params;
                result = await wc.executeJavaScript(code);
            }
            break;
        case 'openDevTools':
            if (wc) {
                await wc.openDevTools();
            }
            break;
        case 'getURL':
            wc ? wc.getURL() : '';
            break
        case 'reload':
            wc ? wc.reload() : null;
            break
        case 'getTitle':
            wc ? wc.getTitle() : '';
            break
        case 'setUserAgent':
            if (wc) {
                const { userAgent } = params || {};
                return wc.setUserAgent(userAgent);
            }
            break
        default:
            result = "error method"
            ok = false;
            break

    }
    if (result && result.headersSent) return;
    res.json({
        ok: true,
        result
    });
}

async function getScreenshot(wc) {
    if (!wc) return null;
    const image = await wc.capturePage();
    return image.resize({
        width: Math.floor(image.getSize().width / 2),
        height: Math.floor(image.getSize().height / 2),
    });
}

/* -----------------------------
 * Express HTTP Server
 * ----------------------------- */
function startHttpServer() {
    const appServer = express();
    appServer.use(cors()); // enable CORS for all origins
    appServer.use(express.json({ limit: '50mb' }));

    appServer.use(
        "/assets",
        express.static(MediaDir),  // serves files
        serveIndex(MediaDir, { icons: true }) // lists directory
    );

    appServer.get('/', async (req, res) => {
        res.status(500).json({ message: "pong" });
    });
    appServer.get('/screenshot', async (req, res) => {
        try {
            const id = req.query.id ? Number(req.query.id) : (mainWindow ? mainWindow.id : 1);

            const win = BrowserWindow.fromId(id);
            if (!win) {
                return res.status(404).json({ error: 'Window not found' });
            }

            const scaled = await getScreenshot(win.webContents);
            const buffer = scaled.toPNG();
            res.setHeader('Content-Type', 'image/png');
            res.send(buffer);
        } catch (err) {
            console.error('[screenshot]', err);
            res.status(500).json({ error: err.message });
        }
    });

    appServer.post('/rpc', async (req, res) => {
        const { method, params } = req.body || {};
        // console.log(req.body); // Reduced log noise
        if (!method) {
            return res.status(400).json({ error: 'method is required' });
        }
        try {
            await handleMethod(method, params, {
                server: {
                    req,
                    res
                }
            });
        } catch (err) {
            console.error('[rpc] error', err);
            res.status(500).json({
                ok: false,
                error: err.message
            });
        }
    });
    const port = process.env.PORT || 3456;
    server = appServer.listen(port, '0.0.0.0', () => {
        const url = `http://127.0.0.1:${port}`;
        console.log(`[express] listening on ${url}`);
    });
}

async function createWindow(account_index, url, options, others) {
    if (!account_index) {
        account_index = 0;
    }
    const currentWindowSites = WindowSites.has(account_index) ? WindowSites.get(account_index) : new Map();
    if (currentWindowSites.get(url)) {
        const currentWinEntry = currentWindowSites.get(url);
        if (currentWinEntry.win && !currentWinEntry.win.isDestroyed()) {
            return currentWinEntry.win;
        }
    }

    if (!options) {
        options = {};
    }
    const { userAgent, cookies, openDevtools, proxy,wrapUrl } = others || {};
    if(!wrapUrl){
        url = `${isLocal ?"http://127.0.0.1:3455":"https://render.cicy.de5.net" }/render?u=${encodeURIComponent(url)}`
    }
    console.log(isLocal,url)
    if (userAgent) {
        if (options.userAgent) delete options.userAgent;
    }
    if (!options.webPreferences) {
        options.webPreferences = {};
    }

    const p = 'p_' + account_index;
    const win = new BrowserWindow({
        width: 720,
        height: 720,
        x: 0,
        y: 0,
        ...options,
        args: [
            '--safebrowsing-disable-download-protection',
            '--safebrowsing-disable-extension-blacklist'
        ],
        webPreferences: {

            partition: 'persist:' + p,
            // webviewTag: true,
            // nodeIntegration: true,
            // contextIsolation: false,
            ...options.webPreferences
        }
    });

    if (proxy) {
        await win.webContents.session.setProxy({
            proxyRules: proxy
        });
        console.log(`[${p}] Proxy set to: ${proxy}`);
    }

    if (cookies) {
        await setCookies(win.webContents, cookies);
    }

    if (openDevtools) {
        win.webContents.openDevTools(openDevtools);
    }

    if (!mainWindow) {
        mainWindow = win;
    }

    const id = win.id;
    const key = `win_${id}`;
    const ses = win.webContents.session;
    const { storagePath } = ses;
    const wcId = win.webContents.id;

    if (userAgent) {
        win.webContents.setUserAgent(userAgent);
    }

    currentWindowSites.set(url, {
        id: win.id,
        wcId,
        win
    });
    WindowSites.set(account_index, currentWindowSites);

    console.log("storagePath", storagePath);
    console.log("wcId", wcId);

    win.loadURL(url);

    win.on("close", () => {
        const currentWindowSites = WindowSites.has(account_index) ? WindowSites.get(account_index) : new Map();
        if (currentWindowSites) {
            currentWindowSites.delete(url);
            WindowSites.set(account_index, currentWindowSites);
        }
    });

    win.webContents.session.webRequest.onBeforeSendHeaders((details, callback) => {
        const { url, method, requestHeaders } = details;

        // Ignore RPC calls to self to avoid log spam and recursion
        if (url.includes('127.0.0.1') && url.includes(process.env.PORT || '3456')) {
            callback({ cancel: false });
            return;
        }
        if(win.isDestroyed()){
            return;
        }
        win.webContents.executeJavaScript(`
if(window.__onBeforeSendHeaders){
    window.__onBeforeSendHeaders(${JSON.stringify({
            index: requestIndex++,
            url,
            requestHeaders,
            win_id: id,
            method,
            timestamp: Date.now() // Added timestamp for frontend display
        })})
}
        `)
        RequestsMap.push({
            index: requestIndex++,
            url,
            requestHeaders,
            win_id: id,
            method,
            timestamp: Date.now() // Added timestamp for frontend display
        });

        if (RequestsMap.length > MAX_REQUEST_LOGS) {
            RequestsMap.shift();
        }

        // console.log('REQUEST:', id, details.url);
        callback({ cancel: false });
    });

    win.webContents.on(
        'console-message',
        (event) => {
            const {
                level,
                message,
                lineNumber,
                sourceId
            } = event;
            if (
                level === 2 && // Warning level
                message.includes('Electron Security Warning')
            ) {
                return;
            }
            if (
                message.includes('ON_REQUEST')
            ) {
                return;
            }
            console.log(`[${key}][renderer][${level}] ${message}`);
        }
    );

    win.webContents.on('did-finish-load', async () => {
        console.log(`[${key}] DOM ready`, { account_index, id, wcId }, win.webContents.getURL());
        console.log(path.join(__dirname,"content.js"))
        const content_js= fs.readFileSync(path.join(__dirname,"content.js"))
        win.webContents.executeJavaScript(content_js.toString())
    });

    return win;
}

//https://www.npmjs.com/package/electron-context-menu
contextMenu({
    showSaveImageAs: true
});
app.whenReady().then(() => {
    console.log('app ready');
    startHttpServer();
});
app.on('before-quit', (event) => {
    console.log("before-quit")
    event.preventDefault();
});