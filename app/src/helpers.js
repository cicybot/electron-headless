const {spawn} = require('child_process');
const {app, session} = require('electron');
const path = require('path');
const fs = require("fs");

function openTerminal(command, showWin) {
    if (!showWin) {
        if (process.platform === 'win32') {
            const p = spawn('cmd.exe', ['/c', 'start', '/B', command], {
                windowsHide: true,
                detached: false,
                stdio: 'ignore',
                shell: false,
                windowsVerbatimArguments: true // 避免参数转义问题
            });
            return p.pid;
        } else {
            const p = spawn(command, [], {
                windowsHide: true,
                detached: true,
                stdio: 'ignore',
                shell: true
            });
            return p.pid;
        }
    }
    const width = 1024;
    const height = 320;
    let p;

    if (process.platform === 'win32') {
        const sizedCmd = `mode con: cols=${Math.floor(width / 8)} lines=${Math.floor(
            height / 16
        )} && ${command}`;
        p = spawn('cmd.exe', ['/k', sizedCmd], {detached: true});
    } else if (process.platform === 'darwin') {
        const script = `
    tell application "Terminal"
        do script "${command.replace(/"/g, '\\"')}"
        set bounds of front window to {0, 0, ${width}, ${height}}
    end tell
    `;
        p = spawn('osascript', ['-e', script], {detached: true});
    } else {
        // Linux - try different terminals
        try {
            p = spawn(
                'gnome-terminal',
                [`--geometry=${width}x${height}`, '--', 'bash', '-c', command],
                {detached: true}
            );
        } catch {
            p = spawn(
                'xterm',
                ['-geometry', `${Math.floor(width / 8)}x${Math.floor(height / 16)}`, '-e', command],
                {detached: true}
            );
        }
    }

    return p.pid;
}

async function setCookies(wc, cookies) {
    for (const c of cookies) {
        const cookie = {...c}; // don't mutate original
        const isSecurePrefix = cookie.name.startsWith("__Secure-");
        const isHostPrefix = cookie.name.startsWith("__Host-");

        let url =
            (cookie.secure ? "https://" : "http://") +
            cookie.domain.replace(/^\./, "");
        if (isSecurePrefix) {
            cookie.secure = true;        // must be secure
            if (!url.startsWith("https://")) {
                url = "https://" + cookie.domain.replace(/^\./, "");
            }
        }
        if (isHostPrefix) {
            cookie.secure = true;        // must be secure
            cookie.path = "/";           // must be /
            cookie.domain = undefined;   // MUST NOT have domain attribute

            if (!url.startsWith("https://")) {
                url = "https://" + cookie.domain?.replace(/^\./, "") || "https://localhost";
            }
        }

        if (!cookie.path) cookie.path = "/";

        try {
            await wc.session.cookies.set({
                url,
                name: cookie.name,
                value: cookie.value,

                path: cookie.path,
                domain: cookie.domain, // may be undefined when __Host-

                httpOnly: !!cookie.httpOnly,
                secure: !!cookie.secure,

                expirationDate: cookie.session ? undefined : cookie.expirationDate,

                sameSite:
                    cookie.sameSite === "no_restriction" ? "no_restriction" :
                        cookie.sameSite === "lax" ? "lax" :
                            cookie.sameSite === "strict" ? "strict" :
                                "unspecified",
            });
        } catch (e) {
            console.error("Failed to set cookie", cookie.name, e);
        }
    }
}

function getAppInfo() {
    const {defaultApp, platform, arch, pid, env, argv, execPath, versions} = process;
    const getCPUUsage = process.getCPUUsage();
    const getHeapStatistics = process.getHeapStatistics();
    const getBlinkMemoryInfo = process.getBlinkMemoryInfo();
    const getProcessMemoryInfo = process.getProcessMemoryInfo();
    const getSystemMemoryInfo = process.getSystemMemoryInfo();
    const getSystemVersion = process.getSystemVersion();

    return {
        session: session.defaultSession.getStoragePath(),
        userData: app.getPath('userData'),
        processId: pid,
        is64Bit: arch === 'x64' || arch === 'arm64',
        platform,
        versions,
        defaultApp,
        else: {
            env, argv, execPath,
            CPUUsage: getCPUUsage,
            HeapStatistics: getHeapStatistics,
            BlinkMemoryInfo: getBlinkMemoryInfo,
            ProcessMemoryInfo: getProcessMemoryInfo,
            SystemMemoryInfo: getSystemMemoryInfo,
            SystemVersion: getSystemVersion
        }
    };
}

function windowSitesToJSON(windowSites) {
    const result = {};
    for (const [groupKey, siteMap] of windowSites.entries()) {
        result[groupKey] = {};
        for (const [url, info] of siteMap.entries()) {
            let bounds = null;
            if (info.win && !info.win.isDestroyed()) {
                try {
                    bounds = info.win.getBounds();
                } catch (error) {
                    console.error('Failed to get window bounds:', error);
                }
            }
            result[groupKey][url] = {
                id: info.id,
                wcId: info.wcId,
                bounds: bounds
            };
        }
    }
    return result;
}

const isVideo = (mime, filePath) => {
    if (mime?.startsWith('video/')) return true;
    return [
        '.mp4', '.mkv', '.mov', '.webm', '.avi', '.flv', '.m4v'
    ].includes(path.extname(filePath).toLowerCase());
};

const extractAudio = (videoPath, audioPath) => {
    return new Promise((resolve, reject) => {
        const ffmpeg = spawn('ffmpeg', [
            '-y',
            '-i', videoPath,
            '-vn',
            '-acodec', 'libmp3lame',
            audioPath
        ]);

        ffmpeg.on('close', code => {
            if (code === 0) resolve();
            else reject(new Error(`ffmpeg exited with ${code}`));
        });
    });
};

const downloadMedia = (session, options, timeout = 300_000) => {
    const {mediaUrl, basePath, id, MediaDir} = options
    return new Promise((resolve, reject) => {
        let timeoutId;

        timeoutId = setTimeout(() => {
            reject(new Error(`Download timeout after ${timeout / 1000}s`));
        }, timeout);

        session.once('will-download', async (event, item) => {
            try {
                const original = item.getFilename();
                const mime = item.getMimeType();
                const ext = path.extname(original);
                const newName = `${id}${ext}`;
                const mediaPath = path.join(MediaDir, basePath, id, newName);
                if (fs.existsSync(mediaPath)) {
                    event.preventDefault()
                    item.cancel()
                    console.log("exists", mediaPath)
                    let finalAudioPath = "";
                    if (isVideo(mime, mediaPath)) {
                        finalAudioPath = mediaPath.replace(ext, '.mp3');
                    }
                    resolve({
                        mediaUrl,
                        mediaPath,
                        audioPath: finalAudioPath,
                        mime,
                        original
                    });
                } else {
                    fs.mkdirSync(path.dirname(mediaPath), {recursive: true})
                    console.log("download", mediaPath)
                    item.setSavePath(mediaPath);
                    item.resume();
                    item.on('updated', (event, state) => {
                        console.log(`Downloading, ${item.getReceivedBytes()} / ${item.getTotalBytes()}`);
                    });
                    item.once('done', async (event, state) => {
                        clearTimeout(timeoutId);

                        if (state !== 'completed') {
                            return reject(new Error(`Download failed: ${state}`));
                        }

                        let finalAudioPath = mediaPath;

                        // 👉 if video → extract audio
                        if (isVideo(mime, mediaPath)) {
                            const audioPath = mediaPath.replace(ext, '.mp3');
                            await extractAudio(mediaPath, audioPath);
                            finalAudioPath = audioPath;
                        }
                        resolve({
                            mediaUrl,
                            mediaPath,
                            audioPath: finalAudioPath,
                            mime,
                            original
                        });
                    });
                }

            } catch (err) {
                clearTimeout(timeoutId);
                reject(err);
            }
        });

        session.downloadURL(mediaUrl);
    });
};


const whisperTranscribe = (audioPath) => {
    return new Promise((resolve, reject) => {
        const curl = spawn('curl', [
            '-s',
            '-X', 'POST',
            'https://colab-whisper.cicy.de5.net/whisper/audio/data',
            '-H', 'Content-Type: multipart/form-data',
            '-F', `file=@${audioPath}`
        ]);

        let output = '';
        curl.stdout.on('data', d => output += d.toString());
        curl.stderr.on('data', d => console.error(d.toString()));

        curl.on('close', code => {
            if (code !== 0) return reject(new Error('Whisper request failed'));
            resolve(JSON.parse(output));
        });
    });
};
const getGlobalJsCode = ()=>{
    let g = ""
    const p = path.join(__dirname, "content.js")
    if (fs.existsSync(p)) {
        g = fs.readFileSync(path.join(__dirname, "content.js")).toString()
    }
    const p1 = path.join(__dirname, "../dist/content.js")
    if (fs.existsSync(p1)) {
        g += fs.readFileSync(path.join(__dirname, "../dist/content.js")).toString()
    }
    return g
}
const executeJavaScript = (wc, code) => {
    code = code.trim();
    //console.log("[EXEC JS]", code)
    if (code.indexOf("(()") === 0) {
        code = "return " + code
    }
    if (code.indexOf("(async ") === 0) {
        code = "return await " + code
    }
    code = `(async ()=>{${code}})()`

    // console.log(code)
    return wc.executeJavaScript(`${code}`)
}

module.exports = {
    getGlobalJsCode,
    executeJavaScript,
    whisperTranscribe,
    downloadMedia,
    getAppInfo,
    openTerminal,
    windowSitesToJSON,
    setCookies
}
