/**
 * ConfigService — Runtime Config + Error Log + Stats Tracking
 * Single source of truth for all feature flags & system health
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CONFIG_FILE = path.join(__dirname, '../../data/system-config.json');

const DEFAULT_CONFIG = {
  aiEnabled: true,
  aiModel: 'gemini-2.5-flash',
  whatsappEnabled: true,
  pushEnabled: true,
  followupEnabled: true,
  maintenanceMode: false,
  dailyMessageLimit: 100,
  alertOnError: true,
};

let _config = { ...DEFAULT_CONFIG };
let _errorLogs = [];
let _stats = {
  aiCalls: 0,
  aiErrors: 0,
  aiFiltered: 0,
  whatsappSent: 0,
  whatsappFailed: 0,
  pushSent: 0,
  totalLeads: 0,
  followupsSent: 0,
  messagesToday: 0,
  startTime: Date.now(),
};

// ─── Daily reset — midnight mein messagesToday reset ─────────────────────────
function scheduleReset() {
  const now = new Date();
  const midnight = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 5);
  const msUntilMidnight = midnight.getTime() - now.getTime();
  setTimeout(() => {
    _stats.messagesToday = 0;
    console.log('[ConfigService] Daily message counter reset');
    setInterval(() => { _stats.messagesToday = 0; }, 24 * 60 * 60 * 1000);
  }, msUntilMidnight);
}
scheduleReset();

// Load persisted config on startup
try {
  if (fs.existsSync(CONFIG_FILE)) {
    const saved = JSON.parse(fs.readFileSync(CONFIG_FILE, 'utf8'));
    _config = { ...DEFAULT_CONFIG, ...saved };
    console.log('[ConfigService] ✅ Config loaded from file');
  }
} catch (e) {
  console.warn('[ConfigService] Could not load config file:', e.message);
}

function saveConfig() {
  try {
    const dir = path.dirname(CONFIG_FILE);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(CONFIG_FILE, JSON.stringify(_config, null, 2));
  } catch (e) {
    console.warn('[ConfigService] Could not save config:', e.message);
  }
}

// ─── Config CRUD ─────────────────────────────────────────────────────────────
export function getConfig() { return { ..._config }; }

export function updateConfig(updates = {}) {
  const allowed = [
    'aiEnabled', 'aiModel', 'whatsappEnabled', 'pushEnabled',
    'followupEnabled', 'maintenanceMode', 'dailyMessageLimit', 'alertOnError',
  ];
  for (const k of allowed) {
    if (k in updates) _config[k] = updates[k];
  }
  saveConfig();
  return { ..._config };
}

export function resetConfig() {
  _config = { ...DEFAULT_CONFIG };
  saveConfig();
  return { ..._config };
}

// ─── Feature flags ────────────────────────────────────────────────────────────
export function isEnabled(feature) {
  if (_config.maintenanceMode && feature !== 'admin') return false;
  return _config[feature] !== false;
}

// ─── Error logging ────────────────────────────────────────────────────────────
export function logError(source, message, details = null) {
  const entry = {
    id: Date.now() + Math.random(),
    ts: new Date().toISOString(),
    source: String(source).slice(0, 40),
    message: String(message).slice(0, 200),
    details: details ? String(details).slice(0, 400) : null,
  };
  _errorLogs.unshift(entry);
  if (_errorLogs.length > 200) _errorLogs = _errorLogs.slice(0, 200);
}

export function getErrorLogs(limit = 50) { return _errorLogs.slice(0, limit); }
export function clearErrorLogs() { _errorLogs = []; }

// ─── Stats ────────────────────────────────────────────────────────────────────
export function increment(key) {
  if (key in _stats) _stats[key]++;
  // Also track daily message count for WA sends
  if (key === 'whatsappSent') _stats.messagesToday++;
}

// ─── Daily limit check ────────────────────────────────────────────────────────
export function isWithinDailyLimit() {
  return _stats.messagesToday < _config.dailyMessageLimit;
}

// ─── Retry with exponential backoff ───────────────────────────────────────────
export async function retryOperation(fn, retries = 3, delayMs = 500) {
  try {
    return await fn();
  } catch (e) {
    if (retries <= 0) throw e;
    await new Promise(r => setTimeout(r, delayMs));
    return retryOperation(fn, retries - 1, delayMs * 2);
  }
}

export function setLeadCount(n) { _stats.totalLeads = n; }

export function getStats() {
  return {
    ..._stats,
    uptimeSeconds: Math.floor((Date.now() - _stats.startTime) / 1000),
    errorCount: _errorLogs.length,
  };
}
