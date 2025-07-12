//import { contextBridge, ipcRenderer } from 'electron'
const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('LLM', {
  sendMsg: (userPrompt) => ipcRenderer.send('LLM_tx', {userPrompt}),
  sendMsgAlt: (prompt) => ipcRenderer.send('LLM_tx_two', {prompt}),
  sendMsgFinal: (prompt) => ipcRenderer.send('LLM_tx_three', {prompt}),
  onLLM_Response: (callback) => ipcRenderer.on('LLM_rx', (_event, value) => callback(value))
})

contextBridge.exposeInMainWorld('env', {
  SUPABASE_URL: process.env.SUPABASE_URL,
  // add other variables as needed
});