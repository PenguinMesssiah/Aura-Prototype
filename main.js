import { app, BrowserWindow, ipcMain, utilityProcess } from 'electron'
import url from 'url'
import path from 'path'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url); 
const __dirname = path.dirname(__filename); // get the name of the directory

const createMainWindow = () => {
  //Create Utility Services
  var llm_util_process = utilityProcess.fork(path.join(__dirname, './assets/util/LLM_cmd.js'), {
    stdio: ['ignore', 'inherit', 'inherit'],
    serviceName: 'LLM Utility Process'
  })

  const mainWindow = new BrowserWindow({
    width: 700,
    height: 800,
    backgroundColor: "#ccc",
    webPreferences: {
      nodeIntegration: false, // to allow imports
      contextIsolation: true, // allow use with Electron 12+
      preload: path.join(__dirname, 'preload.js')
    }
  })

  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'index.html'),
    protocol: 'file:',
    slashes: true
  }))

  mainWindow.on('close', function() {
    app.quit()
  })

  //Initialization Call to Ethics Model
  let msg = {
    type: 0
  }
  llm_util_process.postMessage(msg)
  
  //LLM Util Process Responses
  llm_util_process.on('message', (message) => {
    mainWindow.webContents.send('LLM_tx', message)
  })
}

//Inter-Process Communication
ipcMain.on('LLM_rx', (event, {userPrompt}) => {
  let msg = {
    type: 1,
    userPrompt: userPrompt 
  }
  llm_util_process.postMessage(msg)
});


app.whenReady().then(() => {
  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})