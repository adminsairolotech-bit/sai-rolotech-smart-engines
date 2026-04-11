import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { enqueue } from './queueService.js';
import { getLead, updateLead } from '../models/leadModel.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const CONVERSATIONS_FILE = path.join(DATA_DIR, 'conversations.json');
const SMART_FOLLOWUPS_FILE = path.join(DATA_DIR, 'smart_followups.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const conversations = new Map();
const smartFollowups = new Map();

const DAY_MS = 24 * 60 * 60 * 1000;
const HOUR_MS = 60 * 60 * 1000;
const MAX_CONVERSATIONS_PER_LEAD = 50;

function loadData() {
  try {
    if (fs.existsSync(CONVERSATIONS_FILE)) {
      const raw = JSON.parse(fs.readFileSync(CONVERSATIONS_FILE, 'utf8'));
      Object.entries(raw).forEach(([phone, msgs]) => conversations.set(phone, msgs));
      console.log(`🧠 Loaded conversations for ${conversations.size} leads`);
    }
  } catch {}
  try {
    if (fs.existsSync(SMART_FOLLOWUPS_FILE)) {
      const raw = JSON.parse(fs.readFileSync(SMART_FOLLOWUPS_FILE, 'utf8'));
      raw.forEach(f => smartFollowups.set(f.id, f));
      console.log(`📋 Loaded ${smartFollowups.size} smart follow-ups`);
    }
  } catch {}
}

let saveTimer = null;
function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      const convObj = {};
      conversations.forEach((msgs, phone) => { convObj[phone] = msgs; });
      fs.writeFileSync(CONVERSATIONS_FILE, JSON.stringify(convObj, null, 2));
      fs.writeFileSync(SMART_FOLLOWUPS_FILE, JSON.stringify([...smartFollowups.values()], null, 2));
    } catch (err) {
      console.error('⚠️ Memory save failed:', err.message);
    }
  }, 2000);
}

loadData();

export function saveConversation(phone, role, message, intent = null) {
  const clean = phone.replace(/\D/g, '');
  if (!clean) return;

  let msgs = conversations.get(clean) || [];
  msgs.push({
    role,
    message: message.slice(0, 500),
    intent,
    timestamp: new Date().toISOString(),
  });

  if (msgs.length > MAX_CONVERSATIONS_PER_LEAD) {
    msgs = msgs.slice(-MAX_CONVERSATIONS_PER_LEAD);
  }
  conversations.set(clean, msgs);
  scheduleSave();
}

export function getConversationHistory(phone, limit = 5) {
  const clean = phone.replace(/\D/g, '');
  const msgs = conversations.get(clean) || [];
  return msgs.slice(-limit);
}

export function getLeadProfile(phone) {
  const clean = phone.replace(/\D/g, '');
  const msgs = conversations.get(clean) || [];
  const lead = getLead(clean);

  const intents = msgs.filter(m => m.intent).map(m => m.intent);
  const lastUserMsg = [...msgs].reverse().find(m => m.role === 'user');
  const totalMessages = msgs.length;
  const userMessages = msgs.filter(m => m.role === 'user').length;

  return {
    phone: clean,
    name: lead?.name || 'Unknown',
    city: lead?.city || '',
    product: lead?.machineInterest || lead?.machine_interest || '',
    score: lead?.score || 'COLD',
    source: lead?.source || '',
    totalMessages,
    userMessages,
    intents,
    lastMessage: lastUserMsg?.message || '',
    lastMessageAt: lastUserMsg?.timestamp || null,
    meetingBooked: lead?.meetingBooked || false,
    appInstalled: lead?.appInstalled || false,
  };
}

const INTENT_PATTERNS = {
  visit_plan: {
    patterns: [/\b(aa\s*raha|aaunga|aayenge|aate\s*hain|visit|aana|aa\s*rahe)\b/i, /\b(coming|will come|plan to visit)\b/i],
    action: 'confirm_timing',
    followupText: 'Sir aapka visit plan tha. Aap kis time aayenge bataye?',
    beforeHours: 18,
  },
  meeting_confirm: {
    patterns: [/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday|somvar|mangal|budh|guru|shukra|shani|ravi)\b/i, /\b(kal|parso|aaj|tomorrow|today|day after)\b/i],
    action: 'send_reminder',
    followupText: 'Sir aaj aapki meeting/visit plan thi. Confirm karein kis time aayenge?',
    beforeHours: 12,
  },
  price_interest: {
    patterns: [/\b(price|rate|cost|kitna|quotation|quote|budget)\b/i],
    action: 'send_quotation',
    followupText: 'Sir aapne pricing ke baare mein pucha tha. Kya quotation bhej dein?',
    delayHours: 24,
  },
  demo_request: {
    patterns: [/\b(demo|dekhna|dikhao|show|demonstration|sample)\b/i],
    action: 'schedule_demo',
    followupText: 'Sir aapne demo ka interest dikhaya tha. Kab arrange karein?',
    delayHours: 4,
  },
  machine_inquiry: {
    patterns: [/\b(machine|masheen|equipment|plant|setup|line)\b/i],
    action: 'share_specs',
    followupText: 'Sir aapne machine ke baare mein pucha tha. Koi specific model ya size chahiye?',
    delayHours: 48,
  },
  callback_request: {
    patterns: [/\b(call|phone|baad mein|later|busy|abhi nahi)\b/i],
    action: 'callback',
    followupText: 'Sir pehle aapne kaha tha baad mein baat karenge. Kya ab time hai?',
    delayHours: 6,
  },
  positive_signal: {
    patterns: [/\b(interested|chahiye|lena hai|order|book|kharidna|purchase|buy)\b/i],
    action: 'close_deal',
    followupText: 'Sir aapne interest dikhaya tha. Kya hum order process shuru karein?',
    delayHours: 12,
  },
};

const DAY_MAP = {
  monday: 1, tuesday: 2, wednesday: 3, thursday: 4, friday: 5, saturday: 6, sunday: 0,
  somvar: 1, mangal: 2, budh: 3, guru: 4, shukra: 5, shani: 6, ravi: 0,
};

function detectDayReference(message) {
  const lower = message.toLowerCase();

  if (/\b(aaj|today)\b/.test(lower)) return new Date();
  if (/\b(kal|tomorrow)\b/.test(lower)) {
    const d = new Date();
    d.setDate(d.getDate() + 1);
    return d;
  }
  if (/\b(parso|day after)\b/.test(lower)) {
    const d = new Date();
    d.setDate(d.getDate() + 2);
    return d;
  }

  for (const [word, dayNum] of Object.entries(DAY_MAP)) {
    if (lower.includes(word)) {
      const now = new Date();
      const today = now.getDay();
      let diff = dayNum - today;
      if (diff <= 0) diff += 7;
      const target = new Date(now);
      target.setDate(now.getDate() + diff);
      return target;
    }
  }
  return null;
}

export function detectIntent(message) {
  const results = [];
  for (const [intentName, config] of Object.entries(INTENT_PATTERNS)) {
    for (const pattern of config.patterns) {
      if (pattern.test(message)) {
        results.push({
          intent: intentName,
          action: config.action,
          followupText: config.followupText,
          delayHours: config.delayHours || 0,
          beforeHours: config.beforeHours || 0,
        });
        break;
      }
    }
  }

  const dayRef = detectDayReference(message);
  if (dayRef) {
    results.forEach(r => { r.targetDate = dayRef.toISOString(); });
  }

  return results;
}

export function scheduleSmartFollowup(phone, intent, targetDate = null) {
  const clean = phone.replace(/\D/g, '');
  const lead = getLead(clean);
  if (!lead) return null;

  if (lead.status === 'dnd') return null;

  const existing = [...smartFollowups.values()].find(
    f => f.phone === clean && f.intent === intent.intent && f.status === 'pending'
  );
  if (existing) return null;

  let scheduledAt;
  if (targetDate && intent.beforeHours) {
    const target = new Date(targetDate);
    target.setHours(target.getHours() - intent.beforeHours);
    if (target.getHours() < 9) target.setHours(9, 0, 0, 0);
    if (target.getHours() > 20) target.setHours(20, 0, 0, 0);
    scheduledAt = target;
  } else if (intent.delayHours) {
    scheduledAt = new Date(Date.now() + intent.delayHours * HOUR_MS);
  } else {
    scheduledAt = new Date(Date.now() + 24 * HOUR_MS);
  }

  const now = new Date();
  if (scheduledAt.getHours() < 9) scheduledAt.setHours(9, 0, 0, 0);
  if (scheduledAt.getHours() > 20) scheduledAt.setHours(20, 0, 0, 0);

  if (scheduledAt <= now) {
    scheduledAt = new Date(now.getTime() + HOUR_MS);
  }

  const followup = {
    id: `sf_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
    phone: clean,
    intent: intent.intent,
    action: intent.action,
    message: intent.followupText,
    scheduledAt: scheduledAt.toISOString(),
    targetDate: targetDate || null,
    status: 'pending',
    attempts: 0,
    maxAttempts: 2,
    createdAt: new Date().toISOString(),
    leadName: lead.name || 'Sir',
  };

  smartFollowups.set(followup.id, followup);
  scheduleSave();

  const delayMs = Math.max(0, scheduledAt.getTime() - Date.now());
  enqueue('SMART_FOLLOWUP', { followupId: followup.id }, { delayMs });

  console.log(`🧠 Smart follow-up scheduled: [${intent.intent}] for ${clean} at ${scheduledAt.toLocaleString('en-IN')}`);
  return followup;
}

export function processIncomingMessage(phone, message) {
  const clean = phone.replace(/\D/g, '');

  saveConversation(clean, 'user', message);

  const intents = detectIntent(message);
  const scheduledFollowups = [];

  for (const intent of intents) {
    const followup = scheduleSmartFollowup(clean, intent, intent.targetDate);
    if (followup) scheduledFollowups.push(followup);
  }

  cancelPendingFollowups(clean);

  if (intents.length > 0) {
    const primary = intents[0];
    updateLead(clean, {
      lastIntent: primary.intent,
      lastIntentAt: new Date().toISOString(),
    });
  }

  return { intents, scheduledFollowups };
}

function cancelPendingFollowups(phone) {
  let cancelled = 0;
  smartFollowups.forEach((f) => {
    if (f.phone === phone && f.status === 'pending') {
      const scheduledTime = new Date(f.scheduledAt).getTime();
      const now = Date.now();
      if (scheduledTime - now > 2 * HOUR_MS) {
        f.status = 'cancelled';
        f.cancelledAt = new Date().toISOString();
        f.cancelReason = 'lead_replied';
        cancelled++;
      }
    }
  });
  if (cancelled > 0) scheduleSave();
  return cancelled;
}

export function executeSmartFollowup(followupId) {
  const followup = smartFollowups.get(followupId);
  if (!followup || followup.status !== 'pending') return null;

  const lead = getLead(followup.phone);
  if (!lead) {
    followup.status = 'cancelled';
    scheduleSave();
    return null;
  }

  if (lead.followupIndex >= 999 || lead.status === 'dnd') {
    followup.status = 'cancelled';
    scheduleSave();
    console.log(`⛔ Smart follow-up cancelled (DND/stopped): ${followupId}`);
    return null;
  }

  const history = getConversationHistory(followup.phone, 3);
  const lastUserMsg = [...history].reverse().find(m => m.role === 'user');
  if (lastUserMsg) {
    const lastTime = new Date(lastUserMsg.timestamp).getTime();
    if (Date.now() - lastTime < 2 * HOUR_MS) {
      followup.scheduledAt = new Date(Date.now() + 4 * HOUR_MS).toISOString();
      scheduleSave();
      enqueue('SMART_FOLLOWUP', { followupId }, { delayMs: 4 * HOUR_MS });
      console.log(`⏳ Smart follow-up deferred (recent activity): ${followupId}`);
      return null;
    }
  }

  followup.attempts++;

  const personalizedMsg = followup.message
    .replace(/Sir/g, lead.name || 'Sir');

  return {
    phone: followup.phone,
    message: personalizedMsg,
    leadName: lead.name,
    intent: followup.intent,
    followupId: followup.id,
  };
}

export function markFollowupSent(followupId) {
  const f = smartFollowups.get(followupId);
  if (f) {
    f.status = 'sent';
    f.sentAt = new Date().toISOString();
    saveConversation(f.phone, 'system', f.message, f.intent);
    scheduleSave();
  }
}

export function markFollowupFailed(followupId) {
  const f = smartFollowups.get(followupId);
  if (f && f.attempts < f.maxAttempts) {
    f.status = 'pending';
    f.scheduledAt = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    enqueue('SMART_FOLLOWUP', { followupId }, { delayMs: 30 * 60 * 1000 });
    scheduleSave();
  } else if (f) {
    f.status = 'failed';
    scheduleSave();
  }
}

export function scheduleMeetingReminders(phone, meetingDate) {
  const clean = phone.replace(/\D/g, '');
  const lead = getLead(clean);
  if (!lead) return;

  const meeting = new Date(meetingDate);
  const leadName = lead.name || 'Sir';

  const dayBefore = new Date(meeting);
  dayBefore.setDate(dayBefore.getDate() - 1);
  dayBefore.setHours(18, 0, 0, 0);
  if (dayBefore > new Date()) {
    const reminder1 = {
      id: `mr_${Date.now()}_1`,
      phone: clean,
      intent: 'meeting_reminder_day_before',
      action: 'remind',
      message: `${leadName}, kal aapki meeting hai SAI RoloTech ke saath. Time confirm karein please.`,
      scheduledAt: dayBefore.toISOString(),
      status: 'pending',
      attempts: 0,
      maxAttempts: 1,
      createdAt: new Date().toISOString(),
      leadName,
    };
    smartFollowups.set(reminder1.id, reminder1);
    enqueue('SMART_FOLLOWUP', { followupId: reminder1.id }, { delayMs: Math.max(0, dayBefore.getTime() - Date.now()) });
  }

  const sameMorning = new Date(meeting);
  sameMorning.setHours(9, 0, 0, 0);
  if (sameMorning > new Date()) {
    const reminder2 = {
      id: `mr_${Date.now()}_2`,
      phone: clean,
      intent: 'meeting_reminder_same_day',
      action: 'remind',
      message: `${leadName}, aaj aapki meeting hai. Hum ready hain! Kis time aa rahe hain?`,
      scheduledAt: sameMorning.toISOString(),
      status: 'pending',
      attempts: 0,
      maxAttempts: 1,
      createdAt: new Date().toISOString(),
      leadName,
    };
    smartFollowups.set(reminder2.id, reminder2);
    enqueue('SMART_FOLLOWUP', { followupId: reminder2.id }, { delayMs: Math.max(0, sameMorning.getTime() - Date.now()) });
  }

  scheduleSave();
  console.log(`📅 Meeting reminders set for ${clean} on ${meeting.toLocaleDateString('en-IN')}`);
}

export function getSmartFollowupStats() {
  const all = [...smartFollowups.values()];
  return {
    total: all.length,
    pending: all.filter(f => f.status === 'pending').length,
    sent: all.filter(f => f.status === 'sent').length,
    cancelled: all.filter(f => f.status === 'cancelled').length,
  };
}

export function resumeSmartFollowups() {
  let resumed = 0;
  smartFollowups.forEach((f) => {
    if (f.status === 'pending') {
      const scheduledTime = new Date(f.scheduledAt).getTime();
      const delayMs = Math.max(0, scheduledTime - Date.now());
      if (delayMs < 7 * DAY_MS) {
        enqueue('SMART_FOLLOWUP', { followupId: f.id }, { delayMs: Math.max(5000, delayMs) });
        resumed++;
      } else {
        f.status = 'cancelled';
      }
    }
  });
  if (resumed > 0) {
    console.log(`🔄 Resumed ${resumed} smart follow-ups`);
    scheduleSave();
  }
}

export function buildContextPrompt(phone) {
  const profile = getLeadProfile(phone);
  const history = getConversationHistory(phone, 5);

  let parts = [];
  if (profile.name !== 'Unknown') parts.push(`Customer: ${profile.name}`);
  if (profile.city) parts.push(`Location: ${profile.city}`);
  if (profile.product) parts.push(`Interested in: ${profile.product}`);
  if (profile.score) parts.push(`Lead temperature: ${profile.score}`);
  if (profile.source) parts.push(`Source: ${profile.source}`);
  if (profile.meetingBooked) parts.push('Status: Meeting already booked');
  if (profile.appInstalled) parts.push('Has app installed');

  if (profile.intents.length > 0) {
    const recent = [...new Set(profile.intents.slice(-3))];
    parts.push(`Recent intents: ${recent.join(', ')}`);
  }

  if (history.length > 0) {
    parts.push('\nConversation history:');
    history.forEach(h => {
      const role = h.role === 'user' ? 'Customer' : 'You';
      parts.push(`${role}: ${h.message}`);
    });
  }

  return parts.join('\n');
}
