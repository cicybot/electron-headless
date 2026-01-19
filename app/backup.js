const fs = require("fs");
const path = require("path");
const archiver = require("archiver");

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function zipDirectory(sourceDir, outPath) {
    return new Promise((resolve, reject) => {
        const output = fs.createWriteStream(outPath);
        const archive = archiver("zip", { zlib: { level: 9 } });

        output.on("close", resolve);
        archive.on("error", reject);

        archive.pipe(output);
        archive.directory(sourceDir, false);
        archive.finalize();
    });
}

async function backupToZ({ sourceDir, tmpZip, dstZip }) {
    try {
        if (!fs.existsSync(sourceDir)) {
            console.warn(`⚠️ Source not found, skipped: ${sourceDir}`);
            return false;
        }

        console.log(`📦 Backing up: ${sourceDir}`);

        // 删除 C: 临时 zip
        if (fs.existsSync(tmpZip)) {
            fs.unlinkSync(tmpZip);
        }

        // 压缩到 C:
        await zipDirectory(sourceDir, tmpZip);

        // 等待 zip 真正落盘（最多 10 秒）
        let retry = 0;
        while (!fs.existsSync(tmpZip) && retry < 20) {
            await sleep(500);
            retry++;
        }

        if (!fs.existsSync(tmpZip)) {
            throw new Error(`ZIP creation failed: ${tmpZip}`);
        }

        console.log(`Created ${tmpZip}`);

        // 删除 Z: 目标 zip
        if (fs.existsSync(dstZip)) {
            fs.unlinkSync(dstZip);
        }

        // 移动到 Z:
        fs.renameSync(tmpZip, dstZip);
        console.log(`Moved to ${dstZip}`);

        return true;
    } catch (err) {
        console.error("❌ Backup failed:", err.message);
        return false;
    }
}


(async () => {
    // Chrome
    await backupToZ({
        sourceDir: "C:/Users/runneradmin/AppData/Local/Google/Chrome/User Data",
        tmpZip: "C:/chrome-win.zip",
        dstZip: "Z:/chrome-win.zip",
    });

    // Electron（不存在会自动跳过）
    await backupToZ({
        sourceDir: "C:/Users/runneradmin/AppData/Roaming/Electron",
        tmpZip: "C:/electron-win.zip",
        dstZip: "Z:/electron-win.zip",
    });
})();

