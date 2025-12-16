
function getProcessInfo(){
    const {defaultApp,platform,arch,pid,env,argv,execPath,versions} = process
    const getCPUUsage = process.getCPUUsage()
    const getHeapStatistics = process.getHeapStatistics()
    const getBlinkMemoryInfo = process.getBlinkMemoryInfo()
    const getProcessMemoryInfo = process.getProcessMemoryInfo()
    const getSystemMemoryInfo = process.getSystemMemoryInfo()
    const getSystemVersion = process.getSystemVersion()


    return {
        processId:pid,
        is64Bit: arch === 'x64' || arch === 'arm64',
        platform,
        versions,
        defaultApp,
        else:{
            env,argv,execPath,
            CPUUsage:getCPUUsage,
            HeapStatistics:getHeapStatistics,
            BlinkMemoryInfo:getBlinkMemoryInfo,
            ProcessMemoryInfo:getProcessMemoryInfo,
            SystemMemoryInfo:getSystemMemoryInfo,
            SystemVersion:getSystemVersion
        }
    }
}
export async function handleMethod(method,params,{
    mainWindow,
    screen,
    server:{
        req,
        res
    }
}){
    const mainWebContents = mainWindow.webContents
    let result;
    console.log("[ACT]",method,params)
    switch (method) {
        case 'info':
            const primaryDisplay = screen.getPrimaryDisplay()
            const { width, height } = primaryDisplay.workAreaSize

            return {
                process:getProcessInfo(),
                screen:{width, height },
                getBounds:mainWindow.getBounds(),
                getContentBounds:mainWindow.getContentBounds()
            };
        case 'getBounds':
            return mainWindow.getBounds();
        case 'loadURL':
            const {url} = params
            mainWebContents.loadURL(url);
            break;
        case 'executeJavaScript':
            const {code} = params
            result = await mainWebContents.executeJavaScript(code);
            break
        case 'getURL':
            return mainWebContents.getURL();
        case 'reload':
            return mainWebContents.reload();
        case 'getTitle':
            return mainWebContents.getTitle();
        case 'getUserAgent':
            return mainWebContents.getUserAgent();
        case 'ping':
            result = 'pong';
            break;
        case 'screenshot':
            const image = await mainWebContents.capturePage();
            result = image.toPNG().toString('base64');
            break;
        default:
            return res.status(404).json({ error: 'unknown method' });
    }
    return result
}