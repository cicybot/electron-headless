const {
    openWindow,
    getWindows,
    closeWindow,
    showWindow,
    hideWindow,
    reload,
    loadURL,
    executeJavaScript,
    getBounds,
    getRequests,
    getWindowState,
    getHtmlPageInfo,
    clearRequests,
    getDisplayScreenSize,
    displayScreenshot,
    getWindowScreenshot,
    pyautoguiClick,
    sendElectronClick,
    downloadMedia,
    openTerminal,
} = require('../../src/utils');

describe('RPC Tests', () => {
    it('openWindow', async () => {
        const res = await openWindow("http://127.0.0.1:8888", {});
        
    });

    it('getWindows', async () => {
        const res = await getWindows();
        
    });

    it('closeWindow', async () => {
        const res = await closeWindow(1);
        
    });

    it('showWindow', async () => {
        const res = await showWindow(1);
        
    });

    it('hideWindow', async () => {
        const res = await hideWindow(1);
        
    });

    it('reload', async () => {
        const res = await reload(1);
        
    });

    it('loadURL', async () => {
        const res = await loadURL("https://www.example.com", 1);
        
    });

    it('executeJavaScript', async () => {
        const res = await executeJavaScript(1, "return document.title;");
        
    });

    it('getBounds', async () => {
        const res = await getBounds(1);
        
    });

    it('getRequests', async () => {
        const res = await getRequests(1);
        
    });

    it('getWindowState', async () => {
        const res = await getWindowState(1);
        
    });

    it('getHtmlPageInfo', async () => {
        const res = await getHtmlPageInfo(1);
        
    });

    it('clearRequests', async () => {
        const res = await clearRequests();
        
    });

    it('getDisplayScreenSize', async () => {
        const res = await getDisplayScreenSize();
        
    });

    it('displayScreenshot', async () => {
        const res = await displayScreenshot();
        
    });

    it('getWindowScreenshot', async () => {
        const res = await getWindowScreenshot(1);
        
    });

    it('pyautoguiClick', async () => {
        const res = await pyautoguiClick(100, 100);
        
    });

    it('sendElectronClick', async () => {
        const res = await sendElectronClick(1, 100, 100);
        
    });

    it('downloadMedia', async () => {
        const res = await downloadMedia({
            mediaUrl: "https://example.com/media.mp4"
        }, 1);
        console.log(res);
    });

    it('openTerminal', async () => {
        const res = await openTerminal("echo hello", true);
        console.log(res);
    });

});