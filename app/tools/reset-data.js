const fs = require("fs");
const fse = require("fs-extra");
const path = require("path");
const unzipper = require("unzipper");

/* ================= 工具函数 ================= */

function humanPath(p) {
    return p.replace(/\//g, "\\");
}

async function unzip(zipFile, destDir) {
    return new Promise((resolve, reject) => {
        fs.createReadStream(zipFile)
            .pipe(unzipper.Extract({ path: destDir }))
            .on("close", resolve)
            .on("error", reject);
    });
}

/* ================= 核心逻辑 ================= */

async function resetData({
                             name,
                             zipFile,
                             targetDir
                         }) {
    try {
        console.log(`\n♻️ Resetting ${name}`);
        console.log(`📦 ZIP: ${humanPath(zipFile)}`);
        console.log(`📂 Target: ${humanPath(targetDir)}`);

        // 1️⃣ 检查 zip
        if (!fs.existsSync(zipFile)) {
            throw new Error(`ZIP not found: ${zipFile}`);
        }

        // 2️⃣ 删除原目录
        if (fs.existsSync(targetDir)) {
            console.log("🧹 Removing old data...");
            await fse.remove(targetDir);
        }

        // 3️⃣ 创建目录
        await fse.ensureDir(targetDir);

        // 4️⃣ 解压
        console.log("📂 Extracting...");
        await unzip(zipFile, targetDir);

        console.log(`✅ ${name} data restored`);
        return true;

    } catch (err) {
        console.error(`❌ ${name} restore failed:`, err.message);
        return false;
    }
}

/* ================= 执行 ================= */

(async () => {
    // await resetData({
    //     name: "Chrome",
    //     zipFile: "Z:/chrome-win.zip",
    //     targetDir: "C:/Users/runneradmin/AppData/Local/Google/Chrome/User Data"
    // });

    await resetData({
        name: "Electron",
        zipFile: "Z:/electron-win.zip",
        targetDir: "C:/Users/runneradmin/AppData/Roaming/Electron"
    });

    console.log("\n🎉 Reset completed");
})();
