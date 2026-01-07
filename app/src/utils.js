
const { spawn} = require('child_process');
const { app,session } = require('electron');

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
        p = spawn('cmd.exe', ['/k', sizedCmd], { detached: true });
    } else if (process.platform === 'darwin') {
        const script = `
    tell application "Terminal"
        do script "${command.replace(/"/g, '\\"')}"
        set bounds of front window to {0, 0, ${width}, ${height}}
    end tell
    `;
        p = spawn('osascript', ['-e', script], { detached: true });
    } else {
        // Linux - try different terminals
        try {
            p = spawn(
                'gnome-terminal',
                [`--geometry=${width}x${height}`, '--', 'bash', '-c', command],
                { detached: true }
            );
        } catch {
            p = spawn(
                'xterm',
                ['-geometry', `${Math.floor(width / 8)}x${Math.floor(height / 16)}`, '-e', command],
                { detached: true }
            );
        }
    }

    return p.pid;
}



async function setCookies(wc, cookies) {
    for (const c of cookies) {
        const cookie = { ...c }; // don't mutate original
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
    const { defaultApp, platform, arch, pid, env, argv, execPath, versions } = process;
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
            result[groupKey][url] = {
                id: info.id,
                wcId: info.wcId
            };
        }
    }
    return result;
}

module.exports = {getAppInfo,openTerminal,windowSitesToJSON,setCookies}