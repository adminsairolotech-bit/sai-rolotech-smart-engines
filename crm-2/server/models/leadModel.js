/**
 * Lead Model — in-memory store with JSON file persistence
 * MongoDB nahi hone par bhi data save rehta hai restart ke baad
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.join(__dirname, '..', '..', 'data');
const LEADS_FILE = path.join(DATA_DIR, 'leads.json');

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

// In-memory store
let leads = new Map(); // phone → lead object

// Load existing leads from file
function loadLeads() {
  try {
    if (fs.existsSync(LEADS_FILE)) {
      const raw = fs.readFileSync(LEADS_FILE, 'utf8');
      const arr = JSON.parse(raw);
      arr.forEach(l => leads.set(l.phone, l));
      console.log(`📂 Loaded ${arr.length} leads from disk`);
    }
  } catch (err) {
    console.error('⚠️  Could not load leads:', err.message);
  }
}

// Save leads to file (debounced)
let saveTimer = null;
function scheduleSave() {
  if (saveTimer) clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    try {
      fs.writeFileSync(LEADS_FILE, JSON.stringify([...leads.values()], null, 2));
    } catch (err) {
      console.error('⚠️  Could not save leads:', err.message);
    }
  }, 1000);
}

loadLeads();

/* ── CRUD Operations ── */

// ─── Location Priority System ─────────────────────────────────────────────────
const NEAR_STATES   = ['delhi', 'haryana', 'uttar pradesh', 'up', 'rajasthan', 'punjab', 'himachal pradesh', 'uttarakhand', 'chandigarh'];
const MEDIUM_STATES = ['maharashtra', 'gujarat', 'madhya pradesh', 'mp', 'bihar', 'jharkhand', 'chhattisgarh', 'west bengal'];
// Everything else = FAR (south india, north-east, etc.)

export function getLocationPriority(state = '') {
  const s = state.toLowerCase().trim();
  if (!s) return 'UNKNOWN';
  if (NEAR_STATES.some(n => s.includes(n))) return 'HIGH';
  if (MEDIUM_STATES.some(m => s.includes(m))) return 'MEDIUM';
  return 'LOW';
}

/** Smart composite score: Location 40% + Behavior 40% + Source 20% */
export function calculateSmartScore(lead) {
  let score = 0;

  // Behavior score (40 pts)
  if (lead.meetingBooked) score += 40;
  else if (lead.features?.includes('quotation')) score += 32;
  else if (lead.features?.length > 0) score += 20;
  else if (lead.appOpened) score += 12;

  // Location score (40 pts)
  const loc = lead.locationPriority || getLocationPriority(lead.state);
  if (loc === 'HIGH')   score += 40;
  else if (loc === 'MEDIUM') score += 24;
  else if (loc === 'LOW')    score += 8;

  // Source score (20 pts)
  const src = (lead.source || '').toLowerCase();
  if (src.includes('indiamart')) score += 20;
  else if (src.includes('justdial')) score += 14;
  else if (src === 'app_direct') score += 18;
  else score += 10;

  // Convert to label
  if (score >= 80) return 'VERY_HOT';
  if (score >= 52) return 'HOT';
  if (score >= 30) return 'WARM';
  return 'COLD';
}

export function createLead({ name, phone, source = 'unknown', email = '', extra = {} }) {
  if (!phone) throw new Error('Phone required');
  const clean = phone.replace(/\D/g, '');
  if (leads.has(clean)) return { existing: true, lead: leads.get(clean) };

  const city  = extra.city  || '';
  const state = extra.state || '';
  const locationPriority = getLocationPriority(state);

  const lead = {
    id: `lead_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    name: name || 'Unknown',
    phone: clean,
    email,
    source,
    score: 'COLD',         // COLD | WARM | HOT | VERY_HOT
    smartScore: 0,         // numeric composite score
    status: 'new',         // new | contacted | active | dnd | converted
    conversionStatus: null,// null | 'converted' | 'lost'
    revenue: 0,            // ₹ revenue if converted
    appInstalled: false,
    appOpened: false,
    features: [],          // ['quotation', 'maintenance', 'quality']
    meetingBooked: false,
    dnd: false,
    fcmToken: null,
    followupIndex: 0,
    lastContact: null,
    nextFollowup: null,
    replies: [],
    notes: extra.notes || '',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    ...extra,
    city,
    state,
    locationPriority,      // HIGH | MEDIUM | LOW | UNKNOWN — always override extra
  };

  leads.set(clean, lead);
  scheduleSave();
  return { existing: false, lead };
}

export function getLead(phone) {
  return leads.get(phone.replace(/\D/g, '')) || null;
}

export function updateLead(phone, updates) {
  const clean = phone.replace(/\D/g, '');
  const lead = leads.get(clean);
  if (!lead) return null;
  const updated = { ...lead, ...updates, updatedAt: new Date().toISOString() };
  leads.set(clean, updated);
  scheduleSave();
  return updated;
}

export function getAllLeads() {
  return [...leads.values()];
}

export function getLeadsByScore(score) {
  return [...leads.values()].filter(l => l.score === score);
}

export function getActiveLeads() {
  return [...leads.values()].filter(l => !l.dnd && l.status !== 'converted');
}

export function markDND(phone) {
  return updateLead(phone, { dnd: true, status: 'dnd' });
}

/** Score a lead based on activity + location + source */
export function recalculateScore(phone) {
  const lead = getLead(phone);
  if (!lead) return null;
  const score = calculateSmartScore(lead);
  return updateLead(phone, { score });
}

export function getStats() {
  const all = getAllLeads();
  return {
    total: all.length,
    cold: all.filter(l => l.score === 'COLD').length,
    warm: all.filter(l => l.score === 'WARM').length,
    hot: all.filter(l => l.score === 'HOT').length,
    veryHot: all.filter(l => l.score === 'VERY_HOT').length,
    dnd: all.filter(l => l.dnd).length,
    appInstalled: all.filter(l => l.appInstalled).length,
    meetings: all.filter(l => l.meetingBooked).length,
  };
}

/** Source-wise analytics for ROI tracking */
export function getSourceAnalytics() {
  const all = getAllLeads();
  const sources = {};
  for (const lead of all) {
    const src = lead.source || 'unknown';
    if (!sources[src]) sources[src] = { source: src, total: 0, hot: 0, veryHot: 0, converted: 0, revenue: 0, meetings: 0 };
    sources[src].total++;
    if (lead.score === 'HOT') sources[src].hot++;
    if (lead.score === 'VERY_HOT') { sources[src].veryHot++; sources[src].hot++; }
    if (lead.conversionStatus === 'converted') { sources[src].converted++; sources[src].revenue += lead.revenue || 0; }
    if (lead.meetingBooked) sources[src].meetings++;
  }
  return Object.values(sources)
    .map(s => ({
      ...s,
      conversionRate: s.total > 0 ? Math.round((s.converted / s.total) * 100) : 0,
      hotRate: s.total > 0 ? Math.round(((s.hot) / s.total) * 100) : 0,
    }))
    .sort((a, b) => b.hot - a.hot);
}

/** Location-wise analytics */
export function getLocationAnalytics() {
  const all = getAllLeads();
  const loc = { HIGH: { total: 0, hot: 0, meetings: 0 }, MEDIUM: { total: 0, hot: 0, meetings: 0 }, LOW: { total: 0, hot: 0, meetings: 0 }, UNKNOWN: { total: 0, hot: 0, meetings: 0 } };
  for (const lead of all) {
    const p = lead.locationPriority || 'UNKNOWN';
    if (!loc[p]) continue;
    loc[p].total++;
    if (lead.score === 'HOT' || lead.score === 'VERY_HOT') loc[p].hot++;
    if (lead.meetingBooked) loc[p].meetings++;
  }
  return loc;
}

/** Priority leads — near + hot for immediate action */
export function getPriorityLeads(limit = 10) {
  const all = getAllLeads();
  return all
    .filter(l => !l.dnd && (l.score === 'HOT' || l.score === 'VERY_HOT'))
    .sort((a, b) => {
      const locScore = { HIGH: 3, MEDIUM: 2, LOW: 1, UNKNOWN: 0 };
      const scoreScore = { VERY_HOT: 4, HOT: 3, WARM: 2, COLD: 1 };
      return (locScore[b.locationPriority] + scoreScore[b.score]) - (locScore[a.locationPriority] + scoreScore[a.score]);
    })
    .slice(0, limit)
    .map(l => ({ id: l.id, name: l.name, phone: l.phone.slice(0, -4) + 'XXXX', score: l.score, locationPriority: l.locationPriority, city: l.city, state: l.state, source: l.source, meetingBooked: l.meetingBooked, features: l.features }));
}
