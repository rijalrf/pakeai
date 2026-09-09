import fs from 'fs';
import path from 'path';
import os from 'os';

export interface CliConfig {
  apiUrl: string;
  token?: string;
  activeTaskId?: string;
}

const CONFIG_DIR = path.join(os.homedir(), '.project-ai');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

export function getConfig(): CliConfig {
  try {
    if (!fs.existsSync(CONFIG_FILE)) {
      return {
        apiUrl: process.env.PROJECT_AI_API_URL || 'http://localhost:6655',
      };
    }
    const data = fs.readFileSync(CONFIG_FILE, 'utf-8');
    const parsed = JSON.parse(data);
    return {
      apiUrl: process.env.PROJECT_AI_API_URL || parsed.apiUrl || 'http://localhost:6655',
      token: parsed.token,
      activeTaskId: parsed.activeTaskId,
    };
  } catch (err) {
    return {
      apiUrl: process.env.PROJECT_AI_API_URL || 'http://localhost:6655',
    };
  }
}

export function saveConfig(updates: Partial<CliConfig>): void {
  try {
    if (!fs.existsSync(CONFIG_DIR)) {
      fs.mkdirSync(CONFIG_DIR, { recursive: true });
    }
    const current = getConfig();
    const next = { ...current, ...updates };
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(next, null, 2), 'utf-8');
  } catch (err) {
    console.error('Gagal menyimpan konfigurasi ke', CONFIG_FILE);
  }
}

export function clearConfig(): void {
  try {
    if (fs.existsSync(CONFIG_FILE)) {
      fs.unlinkSync(CONFIG_FILE);
    }
  } catch (err) {
    // ignore
  }
}
