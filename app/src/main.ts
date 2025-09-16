import { app, BrowserWindow } from 'electron';
import path from 'node:path';
import started from 'electron-squirrel-startup';
import { spawn, ChildProcess } from 'child_process';

let pythonProcess: ChildProcess | null = null;

// TODO: pip대신 uv 로 변경 가능?
// TODO: electron-forge 에서 백앤드도 같이 패키지로 설치 가능?
function startPythonBackend() {
  // The path to the Python executable in the virtual environment
  const projectRoot = path.join(__dirname, '..', '..');
  const pythonExe = path.join(projectRoot, '.venv', 'Scripts', 'python.exe');
  const backendPath = path.join(projectRoot, 'backend', 'server.py');

  console.log(`Starting python backend at: ${backendPath}`);
  console.log(`Using python executable: ${pythonExe}`);

  // Start uvicorn server
  pythonProcess = spawn(pythonExe, [
    '-m', 
    'uvicorn', 
    'backend.server:app', 
    '--host', '127.0.0.1', 
    '--port', '8000'
  ], {
    cwd: projectRoot // Set CWD to the 'app' directory
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
  // startPythonBackend();
  createWindow();
});

app.on('quit', () => {
  console.log('Terminating Python backend process...');
  if (pythonProcess) {
    pythonProcess.kill();
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