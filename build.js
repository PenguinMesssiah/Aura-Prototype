/*
 * Copyright 2025 William Scott
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */
import { spawn } from 'child_process';
import { writeFileSync, readFileSync } from 'fs';
import path from 'path';

// Read environment variables from .env file for build
function loadEnvFile() {
  try {
    const envContent = readFileSync('.env', 'utf8');
    const env = {};
    
    envContent.split('\n').forEach(line => {
      const [key, value] = line.split('=');
      if (key && value) {
        env[key.trim()] = value.trim().replace(/^["']|["']$/g, '');
      }
    });
    
    return env;
  } catch (error) {
    console.error('Could not load .env file:', error.message);
    return {};
  }
}

// Build with environment variables
function buildWithEnv() {
  const envVars = loadEnvFile();
  
  // Create a config file that will be bundled with the app
  const configContent = `export const config = ${JSON.stringify(envVars)};`;
  writeFileSync(path.join('assets', 'config.js'), configContent);
  
  const buildProcess = spawn('npm', ['run', 'build:prod'], {
    env: {
      ...process.env,
      ...envVars
    },
    stdio: 'inherit'
  });
  
  buildProcess.on('close', (code) => {
    console.log(`Build process exited with code ${code}`);
  });
}

buildWithEnv();

buildWithEnv();