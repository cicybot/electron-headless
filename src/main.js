const { app,webContents, BrowserWindow,session } = require('electron');
const {screen } = require('electron')

const express = require('express');
const {handleMethod} = require("./actions")
let mainWindow;
let server;

/* -----------------------------
 * Express HTTP Server
 * ----------------------------- */
function startHttpServer() {
    const appServer = express();
    appServer.use(express.json());

// 📸 Screenshot endpoint
    appServer.get('/ping', async (req, res) => {
        res.send("pong")
    });
    // 📸 Screenshot endpoint
    appServer.get('/screenshot', async (req, res) => {
        try {
            if (!mainWindow) {
                return res.status(500).json({ error: 'window not ready' });
            }
            const id = req.query.id ? Number(req.query.id) : 1;
            console.log('[screenshot] id =', id);
            const image = await BrowserWindow.fromId(id).webContents.capturePage();
            const buffer = image.toPNG();
            res.setHeader('Content-Type', 'image/png');
            res.send(buffer);
        } catch (err) {
            console.error('[screenshot]', err);
            res.status(500).json({ error: err.message });
        }
    });

    appServer.post('/rpc', async (req, res) => {
        const { method, params } = req.body || {};
        if (!method) {
            return res.status(400).json({ error: 'method is required' });
        }
        try {
            const result = await handleMethod(method, params,{
                mainWindow,
                BrowserWindow,
                screen,
                createWindow,
                WindowSites,
                server:{
                    req,
                    res
                }
            })
            res.json({
                ok: true,
                result
            });

        } catch (err) {
            console.error('[rpc] error', err);
            res.status(500).json({
                ok: false,
                error: err.message
            });
        }
    });
    server = appServer.listen(3000, '0.0.0.0', () => {
        console.log('[express] listening on http://0.0.0.0:3000');
    });
}

const WindowSites = new Map();
function createWindow(account_index,url,options) {
    if(!account_index){
        account_index = 0
    }
    const currentWindowSites = WindowSites.has(account_index) ? WindowSites.get(account_index) : new Map()
    if(currentWindowSites.get(url)){
        const currentWin = currentWindowSites.get(url)
        currentWin.win.show()
        return currentWin
    }
    if(!options){
        options = {}
    }
    if(!options.webPreferences){
        options.webPreferences = {}
    }

    const p ='p_'+account_index
    const win = new BrowserWindow({
        ...options,
        width: 1920,
        height: 1280,
        x:0,
        y:0,
        webPreferences: {
            webviewTag: true,
            nodeIntegration: true,
            contextIsolation: false,
            partition: 'persist:' + p,
            ...options.webPreferences
        }
    });
    if(!mainWindow){
        mainWindow = win
    }

    const id = win.id
    const key = `win_${id}`
    const ses = win.webContents.session;
    const {storagePath} = ses
    const wcId = win.webContents.id;
    currentWindowSites.set(url,{
        id:win.id,
        wcId,
        win
    })
    WindowSites.set(account_index,currentWindowSites)
    console.log("storagePath",storagePath)
    console.log("wcId",wcId)
    win.loadURL(url);
    win.on("close",()=>{
        const currentWindowSites = WindowSites.has(account_index) ? WindowSites.get(account_index) : new Map()
        if(currentWindowSites){
            currentWindowSites.delete(url)
            WindowSites.set(account_index,currentWindowSites)
        }

    })
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
                level === "warning" &&
                message.includes('Electron Security Warning')
            ) {
                return;
            }
            console.log(`[${key}][renderer][${level}] ${message}`);
        }
    );
    win.webContents.on('did-finish-load', async () => {
        console.log(`[${key}] DOM ready`);
    });

    return win;
}

app.whenReady().then(() => {
    console.log('app ready');
    startHttpServer();
});

app.on('window-all-closed', () => {
    if (server) server.close();
    if (process.platform !== 'darwin') app.quit();
});

