import { app, BrowserWindow, ipcMain, utilityProcess } from 'electron'
import url from 'url'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url); 
const __dirname = path.dirname(__filename);
const logPath = path.join(app.getPath('userData'), 'app.log');

// Import config for production, fallback to process.env for dev
let config = {};
try {
  const configPath = path.join(__dirname, 'assets', 'config.js');
  if (fs.existsSync(configPath)) {
    const configModule = await import(configPath);
    config = configModule.config;
  }
} catch (error) {
  console.log('Config file not found, using process.env');
}

// Helper function to get environment variable
function getEnvVar(key) {
  return config[key] || process.env[key];
}

// Ensure the directory exists
const logDir = path.dirname(logPath);
if (!fs.existsSync(logDir)) {
  fs.mkdirSync(logDir, { recursive: true });
}

function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  try {
    fs.appendFileSync(logPath, logMessage);
    console.log(logMessage.trim()); // Also log to console
  } catch (error) {
    console.error('Failed to write to log file:', error);
    console.log(logMessage.trim());
  }
}

// Add this after your existing log function
function logWithDetails(message, data = null) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}${data ? ': ' + JSON.stringify(data, null, 2) : ''}\n`;
  
  try {
    fs.appendFileSync(logPath, logMessage);
    console.log(logMessage);
  } catch (error) {
    console.log(logMessage);
  }
}

var llm_util_process = null;
var rag_util_process = null;

const createMainWindow = () => {
  const mainWindow = new BrowserWindow({
    width: 2560,
    height: 1440,
    backgroundColor: "#ccc",
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
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

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
    
    setTimeout(() => {
      try {
        logWithDetails('Starting utility process creation');
        // Log environment variables
        logWithDetails('Environment check', {
          DEEPSEEK_API_KEY: getEnvVar('DEEPSEEK_API_KEY') ? 'Present' : 'Missing',
          SUPABASE_URL: getEnvVar('SUPABASE_URL') ? 'Present' : 'Missing',
          SUPABASE_SERVICE_KEY: getEnvVar('SUPABASE_SERVICE_KEY') ? 'Present' : 'Missing',
          isPackaged: app.isPackaged,
          resourcesPath: process.resourcesPath,
          __dirname: __dirname
        });

      const utilPath = app.isPackaged 
        ? path.join(process.resourcesPath, 'app', 'assets', 'util', 'LLM_cmd.js')
        : path.join(__dirname, 'assets', 'util', 'LLM_cmd.js');

      const ragPath = app.isPackaged 
        ? path.join(process.resourcesPath, 'app', 'assets', 'util', 'RAG_pipeline.js')
        : path.join(__dirname, 'assets', 'util', 'RAG_pipeline.js');
        
        logWithDetails('Utility paths', {
          utilPath: utilPath,
          ragPath: ragPath,
          utilExists: fs.existsSync(utilPath),
          ragExists: fs.existsSync(ragPath)
        });

        if (!fs.existsSync(utilPath)) {
          logWithDetails('ERROR: LLM_cmd.js not found at expected path');
          return;
        }
        
        if (!fs.existsSync(ragPath)) {
          logWithDetails('ERROR: RAG_pipeline.js not found at expected path');
          return;
        }

        logWithDetails('Creating LLM utility process');
        
        try {
          llm_util_process = utilityProcess.fork(utilPath, {
            stdio: ['ignore', 'inherit', 'inherit'],
            serviceName: 'LLM Utility Process',
            env: {
              ...process.env,
              DEEPSEEK_API_KEY: getEnvVar('DEEPSEEK_API_KEY')
            }
          });

          if (!llm_util_process) {
            logWithDetails('ERROR: LLM utility process creation returned null');
            return;
          }

          logWithDetails('LLM utility process created successfully');
        } catch (error) {
          logWithDetails('ERROR creating LLM utility process', { error: error.message, stack: error.stack });
          return;
        }

        logWithDetails('Creating RAG utility process');
        
        try {
          rag_util_process = utilityProcess.fork(ragPath, {
            stdio: ['ignore', 'inherit', 'inherit'],
            serviceName: 'RAG Utility Process',
            env: {
              ...process.env,
              SUPABASE_URL: getEnvVar('SUPABASE_URL'),
              SUPABASE_SERVICE_KEY: getEnvVar('SUPABASE_SERVICE_KEY')
            }
          });

          if (!rag_util_process) {
            logWithDetails('ERROR: RAG utility process creation returned null');
            return;
          }

          logWithDetails('RAG utility process created successfully');
        } catch (error) {
          logWithDetails('ERROR creating RAG utility process', { error: error.message, stack: error.stack });
          return;
        }

        // Only set up event handlers if processes were created successfully
        if (llm_util_process) {
          llm_util_process.on('spawn', () => {
            logWithDetails('LLM utility process spawned successfully');
          });
          
          llm_util_process.on('exit', (code, signal) => {
            logWithDetails('LLM utility process exited', { code, signal });
          });

          llm_util_process.on('error', (error) => {
            logWithDetails('LLM utility process error', { error: error.message });
          });

          // Add stderr capture for LLM process
          if (llm_util_process.stderr) {
            llm_util_process.stderr.on('data', (data) => {
              logWithDetails('LLM utility process stderr', data.toString());
            });
          }
        }

        if (rag_util_process) {
          rag_util_process.on('spawn', () => {
            logWithDetails('RAG utility process spawned successfully');
          });
          
          rag_util_process.on('exit', (code, signal) => {
            logWithDetails('RAG utility process exited', { code, signal });
          });

          rag_util_process.on('error', (error) => {
            logWithDetails('RAG utility process error', { error: error.message });
          });

          // Add stderr capture for RAG process
          if (rag_util_process.stderr) {
            rag_util_process.stderr.on('data', (data) => {
              logWithDetails('RAG utility process stderr', data.toString());
            });
          }
        }
        
        // NOW SET UP IPC HANDLERS (after processes exist and are validated)
        if (llm_util_process) {
          ipcMain.on('LLM_tx', (event, {userPrompt}) => {
            let msg = { type: 1, userPrompt: userPrompt }
            llm_util_process.postMessage(msg)
          });

          ipcMain.on('LLM_tx_two', (event, {prompt}) => {
            let msg = { type: 2, userPrompt: prompt }
            llm_util_process.postMessage(msg)
          });
          
          ipcMain.on('LLM_tx_three', (event, {prompt}) => {
            let msg = { type: 3, userPrompt: prompt }
            llm_util_process.postMessage(msg)
          });

          // Process message handlers
          llm_util_process.on('message', (msg) => {
            let type = msg.type
            switch(type) {
              case 0:
                mainWindow.webContents.send('LLM_rx', msg)
                break;
              case 1:
                if (rag_util_process) {
                  let message = {type: 0, expert: msg.expert, userPrompt: msg.userPrompt}
                  console.log('Main.js | Sending to RAG process:', message);
                  rag_util_process.postMessage(message)
                }
                break; 
            }
          });

          // Initialize LLM process
          logWithDetails('Sending initialization message to LLM process');
          llm_util_process.postMessage({type: 0});
        }

        if (rag_util_process) {
          rag_util_process.on('message', (msg) => {
            if (llm_util_process) {
              let message = {
                type: 99,
                expert: msg.expert,
                augmentedPrompt: msg.augmentedPrompt
              }
              llm_util_process.postMessage(message)
            }
          });
        }

        logWithDetails('Initialization complete');
      } catch (error) {
        logWithDetails('Failed to create utility process', { 
          error: error.message, 
          stack: error.stack 
        })
      }
    }, 1000);
  });
}

app.whenReady().then(() => {
  createMainWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createMainWindow() // Fix: was createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})