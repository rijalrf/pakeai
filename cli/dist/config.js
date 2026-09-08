"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.getConfig = getConfig;
exports.saveConfig = saveConfig;
exports.clearConfig = clearConfig;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const os_1 = __importDefault(require("os"));
const CONFIG_DIR = path_1.default.join(os_1.default.homedir(), '.project-ai');
const CONFIG_FILE = path_1.default.join(CONFIG_DIR, 'config.json');
function getConfig() {
    try {
        if (!fs_1.default.existsSync(CONFIG_FILE)) {
            return {
                apiUrl: process.env.PROJECT_AI_API_URL || 'http://localhost:6655',
            };
        }
        const data = fs_1.default.readFileSync(CONFIG_FILE, 'utf-8');
        const parsed = JSON.parse(data);
        return {
            apiUrl: process.env.PROJECT_AI_API_URL || parsed.apiUrl || 'http://localhost:6655',
            token: parsed.token,
            activeTaskId: parsed.activeTaskId,
        };
    }
    catch (err) {
        return {
            apiUrl: process.env.PROJECT_AI_API_URL || 'http://localhost:6655',
        };
    }
}
function saveConfig(updates) {
    try {
        if (!fs_1.default.existsSync(CONFIG_DIR)) {
            fs_1.default.mkdirSync(CONFIG_DIR, { recursive: true });
        }
        const current = getConfig();
        const next = { ...current, ...updates };
        fs_1.default.writeFileSync(CONFIG_FILE, JSON.stringify(next, null, 2), 'utf-8');
    }
    catch (err) {
        console.error('Gagal menyimpan konfigurasi ke', CONFIG_FILE);
    }
}
function clearConfig() {
    try {
        if (fs_1.default.existsSync(CONFIG_FILE)) {
            fs_1.default.unlinkSync(CONFIG_FILE);
        }
    }
    catch (err) {
        // ignore
    }
}
