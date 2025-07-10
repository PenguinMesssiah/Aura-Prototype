//import { contextBridge, ipcRenderer } from 'electron'
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('LLM', {
  sendMsg: (userPrompt) => ipcRenderer.send('LLM_tx', {userPrompt}),
  sendMsgAlt: (prompt) => ipcRenderer.send('LLM_tx_two', {prompt}),
  onLLM_Response: (callback) => ipcRenderer.on('LLM_rx', (_event, value) => callback(value))
})