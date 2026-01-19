const fs = require("fs");
const fse = require("fs-extra");
const path = require("path");
const archiver = require("archiver");

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

async function zipDirectory(sourceDir, outZip) {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(outZip);
        const archive = archiver("zip", { zlib: { level: 9 } });

        output.on("close", resolve);
        archive.on("error", reject);

        archive.pipe(output);
        archive.directory(sourceDir, false);
        archive.finalize();
    });
}

async function backupToZ({
                             sourceDir,
                             tmpCopyDir,   // C:\chrome-copy
                             tmpZip,       // C:\chrome.zip
                             dstZip        // Z:\chrome.zip
                         }) {
    try {
        if (!fs.existsSync(sourceDir)) {
            console.warn(`⚠️ Source not found, skipped: ${sourceDir}`);
            return false;
        }

        console.log(`📦 Backing up: ${sourceDir}`);

        // 1️⃣ 清理旧 copy
        if (fs.existsSync(tmpCopyDir)) {
            await fse.remove(tmpCopyDir);
        }

        // 2️⃣ Copy（忽略锁文件）
        await fse.copy(sourceDir, tmpCopyDir, {
            dereference: true,
            preserveTimestamps: true,
            filter: (src) => {
                // 跳过 Chrome/Electron 的锁文件
                const name = path.basename(src).toLowerCase();
                return !name.endsWith(".lock");
            }
        });

        console.log(`📁 Copied to ${tmpCopyDir}`);

        // 3️⃣ 删除旧 zip
        if (fs.existsSync(tmpZip)) {
            fs.unlinkSync(tmpZip);
        }

        // 4️⃣ Zip copy
        await zipDirectory(tmpCopyDir, tmpZip);

        // 等 zip 真正写完
        let retry = 0;
        while (!fs.existsSync(tmpZip) && retry < 20) {
            await sleep(500);
            retry++;
        }

        if (!fs.existsSync(tmpZip)) {
            throw new Error("ZIP creation failed");
        }

        console.log(`🗜 Created ${tmpZip}`);

        // 5️⃣ 删除 Z: 旧文件
        if (fs.existsSync(dstZip)) {
            fs.unlinkSync(dstZip);
        }

        // 6️⃣ 移动到 Z:
        fs.renameSync(tmpZip, dstZip);
        console.log(`🚚 Moved to ${dstZip}`);

        // 7️⃣ 清理 copy
        await fse.remove(tmpCopyDir);

        return true;
    } catch (err) {
        console.error("❌ Backup failed:", err.message);
        return false;
    }
}

const { backupToZ } = require("./backup-to-z");

(async () => {
    // Chrome
    await backupToZ({
        sourceDir: "C:/Users/runneradmin/AppData/Local/Google/Chrome/User Data",
        tmpCopyDir: "C:/chrome-copy",
        tmpZip: "C:/chrome-win.zip",
        dstZip: "Z:/chrome-win.zip",
    });

    // Electron
    await backupToZ({
        sourceDir: "C:/Users/runneradmin/AppData/Roaming/Electron",
        tmpCopyDir: "C:/electron-copy",
        tmpZip: "C:/electron-win.zip",
        dstZip: "Z:/electron-win.zip",
    });
})();

