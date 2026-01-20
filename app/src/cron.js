const cron = require("node-cron");
const { exec } = require('child_process');

function gitSync() {
    console.log("Running git sync...");
    exec('cd /d/electron-mcp && git add . && git commit -m "not msg" && git push origin mcp', (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return;
        }
        if (stderr) {
            console.error(`Stderr: ${stderr}`);
        }
        console.log(`Stdout: ${stdout}`);
    });
}

gitSync();
cron.schedule("* * * * *", () => {
    gitSync();
});