//import { contextBridge, ipcRenderer } from 'electron'
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('versions', {
  node: () => process.versions.node,
  chrome: () => process.versions.chrome,
  electron: () => process.versions.electron
})

contextBridge.exposeInMainWorld('LLM', {
  sendMsg: (userPrompt) => ipcRenderer.send('LLM_rx', {userPrompt}),
  onResponse: (callback) => ipcRenderer.on('LLM_tx', (_event, value) => callback(value))
})
