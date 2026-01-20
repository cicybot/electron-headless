const { exec } = require('child_process');

const platform = process.platform;
let killCmd;
let sleepCmd;
if (platform === 'win32') {
  killCmd = 'taskkill /f /im electron.exe >nul 2>&1 || true';
  sleepCmd = 'timeout /t 2 /nobreak >nul';
} else if (platform === 'darwin' || platform === 'linux') {
  killCmd = platform === 'darwin' ? 'pkill -f Electron || true' : 'pkill -f electron || true';
  sleepCmd = 'sleep 2';
} else {
  killCmd = 'echo "Unsupported platform"';
  sleepCmd = 'echo "No sleep"';
}

const commands = [
  'npm run build',
  killCmd,
  sleepCmd,
  'npm start'
];

function runCommand(cmd) {
  return new Promise((resolve, reject) => {
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error: ${error.message}`);
        reject(error);
        return;
      }
      if (stderr) {
        console.error(`Stderr: ${stderr}`);
      }
      console.log(`Stdout: ${stdout}`);
      resolve();
    });
  });
}

async function runAll() {
  for (const cmd of commands) {
    try {
      await runCommand(cmd);
    } catch (error) {
      console.error(`Failed on command: ${cmd}`);
      break;
    }
  }
}

runAll();