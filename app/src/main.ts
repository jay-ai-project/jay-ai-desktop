import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { spawn, exec, execSync, ChildProcess } from 'child_process';


let pythonProcess: ChildProcess | null = null;


function startPythonBackend() {
  let command: string;
  let args: string[];
  let processCwd: string;

  if (app.isPackaged) {
    // Production: Run the packaged executable
    const resourcesPath = process.resourcesPath;
    command = path.join(resourcesPath, 'backend_server.exe');
    args = [];
    processCwd = resourcesPath;
  } else {
    // Development: Use uv to run the server
    command = 'uv';
    args = ['run', 'uvicorn', 'src.server:app', '--host', '0.0.0.0', '--port', '8000'];
    processCwd = path.join(app.getAppPath(), 'backend');
  }

  console.log(`[Python Backend] Starting process: ${command} ${args.join(' ')} in ${processCwd}`);

  pythonProcess = spawn(command, args, {
    cwd: processCwd,
    shell: true
    // detached: true is removed to tie the child process lifecycle to the parent
  });

  pythonProcess.stdout.on('data', (data) => {
    console.log(`[Python Backend]: ${data.toString()}`);
  });

  pythonProcess.stderr.on('data', (data) => {
    console.error(`[Python Backend Error]: ${data.toString()}`);
  });

  pythonProcess.on('close', (code) => {
    console.log(`Python backend process exited with code ${code}`);
  });
}

// Handle creating/removing shortcuts on Windows when installing/uninstalling.
if (started) {
  app.quit();
}

const createWindow = () => {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      // It's recommended to set webSecurity to true (default) and use CORS on your server
      // For simplicity in this example, if you face CORS issues, you might consider this,
      // but it's not a best practice.
      // webSecurity: false 
    },
  });

  // and load the index.html of the app.
  if (MAIN_WINDOW_VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(MAIN_WINDOW_VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(
      path.join(__dirname, `../renderer/${MAIN_WINDOW_VITE_NAME}/index.html`),
    );
  }

  // Open the DevTools.
  // mainWindow.webContents.openDevTools();
};

app.on('ready', () => {
  startPythonBackend();
  createWindow();
});

app.on('before-quit', () => {
  if (pythonProcess && !pythonProcess.killed) {
    console.log('Terminating Python backend process synchronously...');
    
    // On Windows, use execSync to block the quit process until the child is killed.
    if (process.platform === 'win32') {
      try {
        console.log(`Using taskkill (sync) on PID: ${pythonProcess.pid}`);
        // Execute taskkill synchronously.
        execSync(`taskkill /PID ${pythonProcess.pid} /F /T`);
        console.log('Backend process terminated.');
      } catch (err) {
        console.error(`Failed to kill backend process: ${err}`);
      }
    } else {
      // Standard kill for macOS, Linux
      pythonProcess.kill();
    }
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});