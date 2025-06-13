//import { contextBridge, ipcRenderer } from 'electron'
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron
})

contextBridge.exposeInMainWorld('LLM', {
  sendMsg: (userPrompt) => ipcRenderer.send('LLM_tx', {userPrompt}),
  onLLM_Response: (callback) => ipcRenderer.on('LLM_rx', (_event, value) => callback(value))
})
