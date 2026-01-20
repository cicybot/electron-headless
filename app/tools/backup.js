const fs = require("fs");
const fse = require("fs-extra");
const path = require("path");
const archiver = require("archiver");

/* ================= 工具函数 ================= */

function sleep(ms) {
    return new Promise(r => setTimeout(r, ms));
}

function humanSize(bytes) {
    const units = ["B", "KB", "MB", "GB", "TB"];
    let i = 0;
    while (bytes >= 1024 && i < units.length - 1) {
        bytes /= 1024;
        i++;
    }
    return `${bytes.toFixed(2)} ${units[i]}`;
}

/**
 * 递归统计目录大小（遇到锁文件自动跳过）
 */
async function getDirSize(dir) {
    let total = 0;

    const items = await fse.readdir(dir, { withFileTypes: true });
    for (const item of items) {
        const full = path.join(dir, item.name);
        try {
            if (item.isDirectory()) {
                total += await getDirSize(full);
            } else if (item.isFile()) {
                const stat = await fse.stat(full);
                total += stat.size;
            }
        } catch {
            // 忽略被锁文件
            continue;
        }
    }
    return total;
}

/**
 * 安全 copy（跳过 Chrome/Electron 锁文件）
 */
async function copyDirSafe(src, dest) {
    await fse.copy(src, dest, {
        dereference: true,
        preserveTimestamps: true,
        filter: (item) => {
            const name = path.basename(item).toLowerCase();
            return ![
                "cookies",
                "cookies-journal",
                "network",
                "gpuCache".toLowerCase(),
                "lockfile"
            ].includes(name);
        }
    });
}

/**
 * zip 目录
 */
function zipDirectory(sourceDir, outZip) {
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

/**
 * 跨盘移动（C: -> Z:）
 */
async function moveAcrossDevice(src, dst) {
    await fse.copyFile(src, dst);
    await fse.remove(src);
}

/* ================= 核心逻辑 ================= */

async function backupToZ({
                             name,
                             sourceDir,
                             tmpCopyDir,
                             tmpZip,
                             dstZip
                         }) {
    try {
        if (!fs.existsSync(sourceDir)) {
            console.warn(`⚠️ Source not found, skipped: ${sourceDir}`);
            return false;
        }

        console.log(`\n📦 Backing up: ${name}`);
        console.log(`📂 Source: ${sourceDir}`);

        // 1️⃣ 清理旧 copy
        await fse.remove(tmpCopyDir);

        // 2️⃣ Copy
        await copyDirSafe(sourceDir, tmpCopyDir);
        console.log(`📁 Copied to ${tmpCopyDir}`);

        // 3️⃣ 统计目录大小
        const dirSize = await getDirSize(tmpCopyDir);
        console.log(`📐 Directory size: ${humanSize(dirSize)}`);

        // 4️⃣ 删除旧 zip
        await fse.remove(tmpZip);

        // 5️⃣ Zip
        await zipDirectory(tmpCopyDir, tmpZip);
        const zipStat = await fse.stat(tmpZip);
        console.log(`🗜 ZIP size: ${humanSize(zipStat.size)}`);

        // 6️⃣ 压缩率
        const ratio = ((zipStat.size / dirSize) * 100).toFixed(1);
        console.log(`📉 Compression ratio: ${ratio}%`);

        // 7️⃣ 删除 Z: 旧文件
        await fse.remove(dstZip);

        // 8️⃣ 跨盘移动
        await moveAcrossDevice(tmpZip, dstZip);
        console.log(`🚚 Moved to ${dstZip}`);

        // 9️⃣ 清理 copy
        await fse.remove(tmpCopyDir);

        return true;
    } catch (err) {
        console.error(`❌ Backup failed (${name}):`, err.message);
        return false;
    }
}

/* ================= 执行 ================= */

(async () => {
    await backupToZ({
        name: "Chrome",
        sourceDir: "C:/Users/runneradmin/AppData/Local/Google/Chrome/User Data",
        tmpCopyDir: "C:/chrome-copy",
        tmpZip: "C:/chrome-win.zip",
        dstZip: "Z:/chrome-win.zip",
    });

    await backupToZ({
        name: "Electron",
        sourceDir: "C:/Users/runneradmin/AppData/Roaming/Electron",
        tmpCopyDir: "C:/electron-copy",
        tmpZip: "C:/electron-win.zip",
        dstZip: "Z:/electron-win.zip",
    });

    console.log("\n✅ All backups finished");
})();
