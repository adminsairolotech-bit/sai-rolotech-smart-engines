/**
 * Activity Logger — Tracks all AI, WhatsApp, and system events
 * Production-level logging for monitoring and debugging
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOG_DIR = path.join(__dirname, '../../data/logs');

if (!fs.existsSync(LOG_DIR)) fs.mkdirSync(LOG_DIR, { recursive: true });

const MAX_MEMORY_LOGS = 500;
const MAX_FILE_SIZE = 5 * 1024 * 1024;

const _logs = {
  ai: [],
  whatsapp: [],
  security: [],
  system: [],
};

function getTimestamp() {
  return new Date().toISOString();
}

function addLog(category, entry) {
  const log = { ts: getTimestamp(), ...entry };
  if (!_logs[category]) _logs[category] = [];
  _logs[category].unshift(log);
  if (_logs[category].length > MAX_MEMORY_LOGS) {
    _logs[category] = _logs[category].slice(0, MAX_MEMORY_LOGS);
  }
  appendToFile(category, log);
}

function appendToFile(category, log) {
  try {
    const file = path.join(LOG_DIR, `${category}-${new Date().toISOString().split('T')[0]}.log`);
    const stats = fs.existsSync(file) ? fs.statSync(file) : null;
    if (stats && stats.size > MAX_FILE_SIZE) return;
    fs.appendFileSync(file, JSON.stringify(log) + '\n');
  } catch (e) { /* silent */ }
}

export function logAI(data) {
  addLog('ai', {
    type: 'ai_call',
    input: String(data.input || '').slice(0, 200),
    output: String(data.output || '').slice(0, 300),
    model: data.model || 'unknown',
    validated: data.validated ?? true,
    issuesFixed: data.issuesFixed || 0,
    latencyMs: data.latencyMs || 0,
    source: data.source || 'unknown',
  });
}

export function logWhatsApp(data) {
  addLog('whatsapp', {
    type: data.type || 'send',
    to: String(data.to || '').replace(/\d{4}$/, '****'),
    template: data.template || 'custom',
    status: data.status || 'sent',
    error: data.error || null,
    blocked: data.blocked || false,
    reason: data.reason || null,
  });
}

export function logSecurity(data) {
  addLog('security', {
    type: data.type || 'alert',
    ip: data.ip || 'unknown',
    endpoint: data.endpoint || '',
    detail: String(data.detail || '').slice(0, 300),
    severity: data.severity || 'medium',
  });
}

export function logSystem(data) {
  addLog('system', {
    type: data.type || 'info',
    message: String(data.message || '').slice(0, 300),
    detail: data.detail || null,
  });
}

export function getLogs(category, limit = 50) {
  if (category && _logs[category]) {
    return _logs[category].slice(0, limit);
  }
  const all = [];
  for (const cat of Object.keys(_logs)) {
    for (const log of _logs[cat]) {
      all.push({ category: cat, ...log });
    }
  }
  all.sort((a, b) => b.ts.localeCompare(a.ts));
  return all.slice(0, limit);
}

export function getLogStats() {
  return {
    ai: _logs.ai.length,
    whatsapp: _logs.whatsapp.length,
    security: _logs.security.length,
    system: _logs.system.length,
    total: Object.values(_logs).reduce((s, a) => s + a.length, 0),
  };
}

export function clearLogs(category) {
  if (category && _logs[category]) {
    _logs[category] = [];
  } else {
    for (const k of Object.keys(_logs)) _logs[k] = [];
  }
}
