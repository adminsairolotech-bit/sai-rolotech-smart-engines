import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';
import { getLead, updateLead, getActiveLeads } from '../models/leadModel.js';
import { enqueue } from './queueService.js';
import { getConversationHistory, getLeadProfile } from './memoryService.js';
import { isEnabled, getConfig } from './configService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const NOTES_FILE = path.join(DATA_DIR, 'lead_notes.json');
const TASKS_FILE = path.join(DATA_DIR, 'tasks.json');

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const leadNotes = new Map();
const tasks = new Map();
let taskIdCounter = 1;

const GEMINI_KEY = process.env.GEMINI_API_KEY || process.env.AI_INTEGRATIONS_GEMINI_API_KEY;

function loadData() {
  try {
    if (fs.existsSync(NOTES_FILE)) {
      const raw = JSON.parse(fs.readFileSync(NOTES_FILE, 'utf8'));
      Object.entries(raw).forEach(([phone, note]) => leadNotes.set(phone, note));
      console.log(`📝 Loaded notes for ${leadNotes.size} leads`);
    }
  } catch {}
  try {
    if (fs.existsSync(TASKS_FILE)) {
      const raw = JSON.parse(fs.readFileSync(TASKS_FILE, 'utf8'));
      raw.forEach(t => {
        tasks.set(t.id, t);
        if (t.id >= taskIdCounter) taskIdCounter = t.id + 1;
      });
      console.log(`📋 Loaded ${tasks.size} tasks`);
    }
  } catch {}
}

let saveTimer = null;
function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      const notesObj = {};
      leadNotes.forEach((note, phone) => { notesObj[phone] = note; });
      fs.writeFileSync(NOTES_FILE, JSON.stringify(notesObj, null, 2));
      fs.writeFileSync(TASKS_FILE, JSON.stringify([...tasks.values()], null, 2));
    } catch (err) {
      console.error('⚠️ Notes/Tasks save failed:', err.message);
    }
  }, 2000);
}

loadData();

async function callGemini(prompt) {
  if (!GEMINI_KEY) throw new Error('No Gemini key');
  const ai = new GoogleGenAI({ apiKey: GEMINI_KEY });
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt,
    config: { maxOutputTokens: 500, temperature: 0.4 },
  });
  return response.text || '';
}

export async function generateLeadNotes(phone) {
  const clean = phone.replace(/\D/g, '');
  const history = getConversationHistory(clean, 15);
  const profile = getLeadProfile(clean);
  const lead = getLead(clean);

  if (history.length === 0 && !lead) return null;

  const conversationText = history.map(h => {
    const role = h.role === 'user' ? 'Customer' : 'Sales';
    return `${role}: ${h.message}`;
  }).join('\n');

  const leadInfo = [];
  if (profile.name !== 'Unknown') leadInfo.push(`Name: ${profile.name}`);
  if (profile.city) leadInfo.push(`City: ${profile.city}`);
  if (profile.product) leadInfo.push(`Product Interest: ${profile.product}`);
  if (profile.source) leadInfo.push(`Source: ${profile.source}`);
  if (profile.score) leadInfo.push(`Score: ${profile.score}`);

  const prompt = `You are a CRM sales assistant for SAI RoloTech (industrial automation company).

Lead Info:
${leadInfo.join('\n') || 'No details available'}

Conversation:
${conversationText || 'No conversation yet'}

Analyze and return ONLY valid JSON (no markdown, no backticks):
{
  "summary": "2-3 line summary of customer need and situation",
  "customerNeed": "what the customer wants",
  "interestLevel": "HIGH or MEDIUM or LOW",
  "nextAction": "specific next step to take",
  "priority": "HIGH or MEDIUM or LOW",
  "keyPoints": ["point1", "point2"],
  "followupMessage": "short friendly WhatsApp follow-up message in Hinglish"
}`;

  try {
    const raw = await callGemini(prompt);
    const jsonMatch = raw.match(/\{[\s\S]*\}/);
    if (!jsonMatch) throw new Error('No JSON in response');

    const aiData = JSON.parse(jsonMatch[0]);

    const note = {
      phone: clean,
      leadName: profile.name || lead?.name || 'Unknown',
      summary: (aiData.summary || '').slice(0, 500),
      customerNeed: (aiData.customerNeed || '').slice(0, 300),
      interestLevel: ['HIGH', 'MEDIUM', 'LOW'].includes(aiData.interestLevel) ? aiData.interestLevel : 'MEDIUM',
      nextAction: (aiData.nextAction || '').slice(0, 300),
      priority: ['HIGH', 'MEDIUM', 'LOW'].includes(aiData.priority) ? aiData.priority : 'MEDIUM',
      keyPoints: Array.isArray(aiData.keyPoints) ? aiData.keyPoints.slice(0, 5).map(p => String(p).slice(0, 100)) : [],
      followupMessage: (aiData.followupMessage || '').slice(0, 300),
      conversationCount: history.length,
      score: profile.score,
      updatedAt: new Date().toISOString(),
      generatedBy: 'gemini',
    };

    leadNotes.set(clean, note);
    scheduleSave();

    if (note.nextAction) {
      autoCreateTask(clean, note);
    }

    console.log(`📝 Notes generated for ${clean}: Priority=${note.priority}, Interest=${note.interestLevel}`);
    return note;
  } catch (err) {
    console.error(`❌ Notes generation failed for ${clean}:`, err.message);
    return null;
  }
}

function autoCreateTask(phone, note) {
  const existing = [...tasks.values()].find(
    t => t.phone === phone && t.status === 'pending' && t.source === 'ai_notes'
  );
  if (existing) return;

  const now = new Date();
  let scheduledAt;

  if (note.priority === 'HIGH') {
    scheduledAt = new Date(now.getTime() + 4 * 60 * 60 * 1000);
  } else if (note.priority === 'MEDIUM') {
    scheduledAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  } else {
    scheduledAt = new Date(now.getTime() + 48 * 60 * 60 * 1000);
  }

  if (scheduledAt.getHours() < 9) scheduledAt.setHours(9, 0, 0, 0);
  if (scheduledAt.getHours() > 20) {
    scheduledAt.setDate(scheduledAt.getDate() + 1);
    scheduledAt.setHours(9, 0, 0, 0);
  }

  const task = {
    id: taskIdCounter++,
    phone,
    leadName: note.leadName,
    task: note.nextAction,
    followupMessage: note.followupMessage || '',
    priority: note.priority,
    scheduledAt: scheduledAt.toISOString(),
    status: 'pending',
    source: 'ai_notes',
    createdAt: new Date().toISOString(),
    completedAt: null,
  };

  tasks.set(task.id, task);
  scheduleSave();

  const delayMs = Math.max(0, scheduledAt.getTime() - Date.now());
  enqueue('TASK_FOLLOWUP', { taskId: task.id }, { delayMs });

  console.log(`📋 Auto-task created: [${note.priority}] "${note.nextAction.slice(0, 50)}" for ${phone}`);
}

export function createManualTask(phone, taskText, scheduledAt, priority = 'MEDIUM') {
  const clean = phone.replace(/\D/g, '');
  const lead = getLead(clean);

  const schedDate = new Date(scheduledAt);
  if (isNaN(schedDate.getTime())) return null;

  const task = {
    id: taskIdCounter++,
    phone: clean,
    leadName: lead?.name || 'Unknown',
    task: taskText.slice(0, 300),
    followupMessage: '',
    priority: ['HIGH', 'MEDIUM', 'LOW'].includes(priority) ? priority : 'MEDIUM',
    scheduledAt: schedDate.toISOString(),
    status: 'pending',
    source: 'manual',
    createdAt: new Date().toISOString(),
    completedAt: null,
  };

  tasks.set(task.id, task);
  scheduleSave();

  const delayMs = Math.max(0, schedDate.getTime() - Date.now());
  enqueue('TASK_FOLLOWUP', { taskId: task.id }, { delayMs });

  return task;
}

export function completeTask(taskId) {
  const task = tasks.get(taskId);
  if (!task) return null;
  task.status = 'completed';
  task.completedAt = new Date().toISOString();
  scheduleSave();
  return task;
}

export function skipTask(taskId) {
  const task = tasks.get(taskId);
  if (!task) return null;
  task.status = 'skipped';
  task.completedAt = new Date().toISOString();
  scheduleSave();
  return task;
}

export function getTodayTasks() {
  const today = new Date();
  const todayStr = today.toISOString().slice(0, 10);
  return [...tasks.values()].filter(t => {
    return t.status === 'pending' && t.scheduledAt.slice(0, 10) <= todayStr;
  }).sort((a, b) => {
    const pOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return (pOrder[a.priority] || 1) - (pOrder[b.priority] || 1);
  });
}

export function getUpcomingTasks(days = 7) {
  const cutoff = new Date(Date.now() + days * 24 * 60 * 60 * 1000);
  return [...tasks.values()].filter(t => {
    return t.status === 'pending' && new Date(t.scheduledAt) <= cutoff;
  }).sort((a, b) => new Date(a.scheduledAt) - new Date(b.scheduledAt));
}

export function getLeadTasks(phone) {
  const clean = phone.replace(/\D/g, '');
  return [...tasks.values()].filter(t => t.phone === clean)
    .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
}

export function getLeadNotes(phone) {
  const clean = phone.replace(/\D/g, '');
  return leadNotes.get(clean) || null;
}

export function getAllNotes() {
  return [...leadNotes.values()].sort((a, b) => {
    const pOrder = { HIGH: 0, MEDIUM: 1, LOW: 2 };
    return (pOrder[a.priority] || 1) - (pOrder[b.priority] || 1);
  });
}

export async function generateDailyPlan() {
  const todayTasks = getTodayTasks();
  if (todayTasks.length === 0) {
    return { plan: 'Aaj koi pending task nahi hai. Naye leads pe focus karein!', tasks: [], generatedAt: new Date().toISOString() };
  }

  const taskSummary = todayTasks.map((t, i) => {
    return `${i + 1}. [${t.priority}] ${t.leadName} (${t.phone}): ${t.task}`;
  }).join('\n');

  const prompt = `You are a sales manager assistant for SAI RoloTech (industrial automation).

Today's pending tasks:
${taskSummary}

Create a short action plan in Hinglish (Hindi-English mix). Format:
- Start with a greeting
- List tasks in priority order with specific times (9 AM - 7 PM)
- Add a motivational line at end
- Keep it under 200 words
- No markdown formatting`;

  try {
    const plan = await callGemini(prompt);
    const result = {
      plan: plan.slice(0, 1000),
      tasks: todayTasks,
      taskCount: todayTasks.length,
      highPriority: todayTasks.filter(t => t.priority === 'HIGH').length,
      generatedAt: new Date().toISOString(),
    };
    console.log(`📊 Daily plan generated: ${todayTasks.length} tasks`);
    return result;
  } catch (err) {
    console.error('❌ Daily plan generation failed:', err.message);
    return {
      plan: `Aaj ${todayTasks.length} tasks hain. HIGH priority pehle karein!`,
      tasks: todayTasks,
      taskCount: todayTasks.length,
      generatedAt: new Date().toISOString(),
    };
  }
}

export async function generateFollowUpMessage(phone) {
  const clean = phone.replace(/\D/g, '');
  const notes = leadNotes.get(clean);
  const lead = getLead(clean);

  if (!notes && !lead) return null;

  const prompt = `You are a friendly sales assistant for SAI RoloTech (industrial machinery).

Customer: ${notes?.leadName || lead?.name || 'Sir'}
${notes?.summary ? `Notes: ${notes.summary}` : ''}
${notes?.nextAction ? `Next Action: ${notes.nextAction}` : ''}
${notes?.customerNeed ? `Need: ${notes.customerNeed}` : ''}

Write a short, friendly WhatsApp follow-up message in Hinglish (Hindi-English mix).
Rules:
- Be polite, no pressure
- Reference their specific interest if known
- Keep under 50 words
- No emojis overuse (max 2)
- End with a question to encourage reply`;

  try {
    const msg = await callGemini(prompt);
    return msg.slice(0, 300).trim();
  } catch (err) {
    console.error('❌ Follow-up message generation failed:', err.message);
    return notes?.followupMessage || `${notes?.leadName || 'Sir'}, aapki inquiry ke baare mein baat karni thi. Kya aap available hain?`;
  }
}

export function executeTaskFollowup(taskId) {
  const task = tasks.get(taskId);
  if (!task || task.status !== 'pending') return null;

  const lead = getLead(task.phone);
  if (!lead || lead.status === 'dnd') {
    task.status = 'skipped';
    task.completedAt = new Date().toISOString();
    task.skipReason = lead ? 'lead_dnd' : 'lead_not_found';
    scheduleSave();
    return null;
  }

  task.status = 'processing';
  scheduleSave();

  return {
    taskId: task.id,
    phone: task.phone,
    leadName: task.leadName,
    task: task.task,
    followupMessage: task.followupMessage,
    priority: task.priority,
  };
}

export function markTaskFailed(taskId, reason = 'send_failed') {
  const task = tasks.get(taskId);
  if (!task) return;
  task.status = 'failed';
  task.completedAt = new Date().toISOString();
  task.failReason = reason;
  scheduleSave();
}

export function getTaskStats() {
  const all = [...tasks.values()];
  const today = new Date().toISOString().slice(0, 10);
  const todayTasks = all.filter(t => t.scheduledAt.slice(0, 10) <= today && t.status === 'pending');
  return {
    total: all.length,
    pending: all.filter(t => t.status === 'pending').length,
    completed: all.filter(t => t.status === 'completed').length,
    skipped: all.filter(t => t.status === 'skipped').length,
    todayPending: todayTasks.length,
    highPriority: todayTasks.filter(t => t.priority === 'HIGH').length,
    notesCount: leadNotes.size,
  };
}

export async function bulkGenerateNotes() {
  const activeLeads = getActiveLeads();
  let generated = 0;
  let failed = 0;

  for (const lead of activeLeads.slice(0, 20)) {
    const history = getConversationHistory(lead.phone, 5);
    if (history.length < 2) continue;

    const existing = leadNotes.get(lead.phone);
    if (existing) {
      const lastUpdate = new Date(existing.updatedAt).getTime();
      if (Date.now() - lastUpdate < 12 * 60 * 60 * 1000) continue;
    }

    try {
      await generateLeadNotes(lead.phone);
      generated++;
      await new Promise(r => setTimeout(r, 1000));
    } catch {
      failed++;
    }
  }

  return { generated, failed, total: activeLeads.length };
}

export function resumeTasks() {
  let resumed = 0;
  tasks.forEach((task) => {
    if (task.status === 'pending') {
      const scheduledTime = new Date(task.scheduledAt).getTime();
      const delayMs = Math.max(0, scheduledTime - Date.now());
      if (delayMs < 7 * 24 * 60 * 60 * 1000) {
        enqueue('TASK_FOLLOWUP', { taskId: task.id }, { delayMs: Math.max(5000, delayMs) });
        resumed++;
      }
    }
  });
  if (resumed > 0) {
    console.log(`🔄 Resumed ${resumed} pending tasks`);
  }
}

export function startDailyTaskCron() {
  const scheduleNext = () => {
    const now = new Date();
    const next9am = new Date(now);
    next9am.setHours(9, 0, 0, 0);
    if (next9am <= now) next9am.setDate(next9am.getDate() + 1);
    const delay = next9am.getTime() - now.getTime();

    setTimeout(async () => {
      console.log('🌅 Morning task review starting...');
      try {
        const plan = await generateDailyPlan();
        console.log(`📊 Daily Plan: ${plan.taskCount} tasks | ${plan.highPriority} HIGH priority`);
        console.log(plan.plan);

        const todayTasks = getTodayTasks();
        for (const task of todayTasks) {
          if (task.followupMessage) {
            enqueue('TASK_FOLLOWUP', { taskId: task.id }, { delayMs: 5000 });
          }
        }
      } catch (err) {
        console.error('❌ Morning cron failed:', err.message);
      }
      scheduleNext();
    }, delay);

    console.log(`⏰ Next morning plan: ${next9am.toLocaleString('en-IN')}`);
  };

  scheduleNext();
}
