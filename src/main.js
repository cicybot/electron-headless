const { app, BrowserWindow } = require('electron');
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

            const image = await mainWindow.webContents.capturePage();
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
                screen,
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

function createWindow() {
    mainWindow = new BrowserWindow({
        width: 1024,
        height: 768,
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false,
        }
    });
    mainWindow.loadURL("http://192.168.100.58:5173/");

    mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
        if(level === 2 && message.indexOf("cElectron Security Warning") >0){
            return;
        }
        console.log(`[renderer][${level}] ${message}`);
    });

    // 页面加载完成
    mainWindow.webContents.on('did-finish-load', async () => {
        console.log('[main] DOM ready');
    });
}


app.whenReady().then(() => {
    console.log('app ready');
    startHttpServer();
    createWindow();
});

app.on('window-all-closed', () => {
    if (server) server.close();
    if (process.platform !== 'darwin') app.quit();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
});
