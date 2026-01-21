const { exec } = require('child_process');

const platform = process.platform;

function checkElectronProcesses() {
  return new Promise((resolve) => {
    let cmd;
    
    if (platform === 'win32') {
      cmd = 'tasklist | findstr /i electron.exe';
    } else if (platform === 'darwin' || platform === 'linux') {
      cmd = 'ps aux | grep "electron" | grep -v grep | grep -v "stop-electron.js" | head -3';
    } else {
      resolve(false);
      return;
    }

    exec(cmd, { timeout: 3000 }, (error, stdout, stderr) => {
      const hasProcesses = stdout && stdout.trim().length > 0;
      resolve(hasProcesses);
    });
  });
}

function killElectronProcesses() {
  return new Promise((resolve) => {
    console.log('Killing Electron processes...');
    
    if (platform === 'win32') {
      exec('taskkill /f /im electron.exe', { timeout: 5000 }, (error, stdout, stderr) => {
        if (error) {
          console.log('No electron.exe processes found or access denied');
        } else {
          console.log('Electron processes killed on Windows');
        }
        resolve();
      });
    } else if (platform === 'darwin' || platform === 'linux') {
      // Kill electron main processes and child processes, but exclude the current script
      exec('pkill -f "electron.*--trace-warnings" || pkill -f "electron.*type=" || pkill -f "/electron/dist/electron" || true', { timeout: 5000 }, (error, stdout, stderr) => {
        console.log('Pkill command completed');
        resolve();
      });
    } else {
      console.log('Unsupported platform');
      resolve();
    }
  });
}

async function waitForNoElectron(maxAttempts = 5, delay = 1000) {
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const hasProcesses = await checkElectronProcesses();
    
    if (!hasProcesses) {
      console.log('No Electron processes found - all clear!');
      return true;
    }
    
    console.log(`Electron processes still running (attempt ${attempt}/${maxAttempts}), killing again...`);
    await killElectronProcesses();
    
    if (attempt < maxAttempts) {
      console.log(`Waiting ${delay}ms before checking again...`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  
  console.log('Warning: Could not kill all Electron processes after maximum attempts');
  return false;
}

async function main() {
  console.log(`Stopping all Electron processes on ${platform}...`);

  // // First attempt to kill
  // await killElectronProcesses();

  // // Block until no processes remain
  // const success = await waitForNoElectron();

  // if (success) {
  //   console.log('All Electron processes stopped successfully');
  // } else {
  //   console.log('Some Electron processes may still be running');
  // }

  if (true) {
    console.log('Starting Electron...');
    let cmd = "electron --trace-warnings src/main.js"
    if(platform === 'linux'){
      cmd = "electron --disable-features=UseDBus --enable-unsafe-swiftshader  --no-sandbox --disable-gpu --trace-warnings src/main.js"
    }
    exec(cmd, (error, stdout, stderr) => {
      if (error) {
        console.error('Error starting Electron:', error);
        process.exit(1);
      }
    });
  } else {
    process.exit(1);
  }
}

main().catch(error => {
  console.error('Error stopping Electron processes:', error);
  process.exit(1);
});