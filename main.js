import { app, BrowserWindow, ipcMain, utilityProcess } from 'electron'
import url from 'url'
import path from 'path'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url); 
const __dirname = path.dirname(__filename); // get the name of the directory

var llm_util_process = null;
var rag_util_process = null;

const createMainWindow = () => {
  //Create Utility Service: Handles LLM Calls
  llm_util_process = utilityProcess.fork(path.join(__dirname, './assets/util/LLM_cmd.js'), {
    stdio: ['ignore', 'inherit', 'inherit'],
    serviceName: 'LLM Utility Process'
  })

  //Create Utility Service: Handles Vectorization
  rag_util_process = utilityProcess.fork(path.join(__dirname, './assets/util/RAG_pipeline.js'), {
    stdio: ['ignore', 'inherit', 'inherit'],
    serviceName: 'RAG Utility Process'
  })

  const mainWindow = new BrowserWindow({
    width: 2560,
    height: 1440,
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
  llm_util_process.on('message', (msg) => {
    let type = msg.type

    switch(type) {
      case 0: //Send LLM Response to Front-End
        mainWindow.webContents.send('LLM_rx', msg)
        break;
      case 1: //Send LLM Request to RAG Pipeline
        let message = {type: 0, expert: msg.expert, userPrompt: msg.userPrompt}
        rag_util_process.postMessage(message)
        break; 
    }
  })

  //RAG Util Process Responses
  rag_util_process.on('message', (msg) => {
    // Send augmentedPrompt to LLM Util Process 
    let message = {
      type: 99,
      expert: msg.expert,
      augmentedPrompt: msg.augmentedPrompt
    }
    llm_util_process.postMessage(message)
  })
}

//Inter-Process Communication
ipcMain.on('LLM_tx', (event, {userPrompt}) => {
  let msg = {
    type: 1,
    userPrompt: userPrompt 
  }
  llm_util_process.postMessage(msg)
});

ipcMain.on('LLM_tx_two', (event, {prompt}) => {
  let msg = {
    type: 2,
    userPrompt: prompt 
  }
  llm_util_process.postMessage(msg)
});
ipcMain.on('LLM_tx_three', (event, {prompt}) => {
  let msg = {
    type: 3,
    userPrompt: prompt 
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