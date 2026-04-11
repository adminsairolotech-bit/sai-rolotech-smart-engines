/**
 * Lead Routes
 * POST /new-lead          — Pabbly webhook (lead capture)
 * POST /api/track         — App behavior tracking
 * POST /api/wa-webhook    — WhatsApp incoming messages
 * POST /api/book-meeting  — Calendar booking
 * GET  /api/leads         — Admin: all leads (auth protected)
 * GET  /api/lead-stats    — Admin: summary stats
 * POST /api/report        — Trigger manual daily report
 */
import express from 'express';
import { createLead, getLead, updateLead, getAllLeads, getStats, recalculateScore, getSourceAnalytics, getLocationAnalytics, getPriorityLeads } from '../models/leadModel.js';
import { enqueue } from '../services/queueService.js';
import { scheduleFollowups, stopFollowups } from '../services/followupService.js';
import { handleIncoming, sendAdminAlert } from '../services/whatsappService.js';
import { getAvailableSlots, bookMeeting } from '../services/calendarService.js';
import { generateAndSendReport } from '../services/reportService.js';
import { generateReply } from '../services/aiManager.js';
import { processIncomingMessage, saveConversation, scheduleMeetingReminders } from '../services/memoryService.js';

const router = express.Router();

/* ── Simple admin token check ── */
function adminAuth(req, res, next) {
  const token = req.headers['x-admin-token'] || req.headers['authorization']?.replace('Bearer ', '');
  const ADMIN_TOKEN = process.env.ADMIN_API_TOKEN;
  if (!ADMIN_TOKEN) return res.status(503).json({ error: 'ADMIN_API_TOKEN env var not configured' });
  if (token !== ADMIN_TOKEN) return res.status(401).json({ error: 'Unauthorized' });
  next();
}

/* ── Input sanitizer ── */
function sanitize(str) {
  return String(str || '').trim().slice(0, 500);
}

/**
 * POST /new-lead
 * Pabbly Connect se aata hai — Google Ads / Form submissions
 */
router.post('/new-lead', async (req, res) => {
  try {
    const { name, phone, source, email, notes, city, state } = req.body;

    if (!phone) return res.status(400).json({ error: 'Phone required' });

    const { existing, lead } = createLead({
      name: sanitize(name),
      phone: sanitize(phone),
      source: sanitize(source) || 'pabbly',
      email: sanitize(email),
      extra: { notes: sanitize(notes), city: sanitize(city || ''), state: sanitize(state || '') },
    });

    if (existing) {
      console.log(`♻️  Duplicate lead: ${phone}`);
      return res.json({ success: true, duplicate: true, leadId: lead.id });
    }

    // Queue welcome WhatsApp message
    enqueue('SEND_WELCOME', { phone: lead.phone }, { delayMs: 2000 });

    // Queue 4-month follow-up schedule
    scheduleFollowups(lead);

    console.log(`🆕 New lead: ${lead.name} (${lead.phone}) from ${lead.source}`);
    res.json({ success: true, leadId: lead.id });
  } catch (err) {
    console.error('New lead error:', err.message);
    res.status(500).json({ error: 'Internal error' });
  }
});

/**
 * POST /api/track
 * App installs and feature usage tracking
 * Body: { phone, event: 'download'|'app_open'|'quotation'|'maintenance'|'quality', fcmToken? }
 */
router.post('/api/track', async (req, res) => {
  try {
    const { phone, event, fcmToken } = req.body;
    if (!phone || !event) return res.status(400).json({ error: 'phone and event required' });

    let lead = getLead(phone);
    if (!lead) {
      // Auto-create if not exists (app user not from Pabbly)
      const result = createLead({ phone, name: 'App User', source: 'app_direct' });
      lead = result.lead;
    }

    const updates = { lastActive: new Date().toISOString() };

    switch (event) {
      case 'download':
        updates.appInstalled = true;
        break;
      case 'app_open':
        updates.appOpened = true;
        if (fcmToken) updates.fcmToken = fcmToken;
        break;
      case 'quotation':
      case 'maintenance':
      case 'quality':
        updates.features = [...new Set([...(lead.features || []), event])];
        break;
    }

    const updated = updateLead(phone, updates);
    const scored = recalculateScore(phone);

    // If quotation used → HOT → alert admin + followup message
    if (event === 'quotation' && scored?.score === 'HOT') {
      enqueue('SEND_QUOTATION_FOLLOWUP', { phone }, { delayMs: 3000 });
      enqueue('ADMIN_ALERT', { phone, event: 'Quotation Used' }, { delayMs: 1000 });
      console.log(`🔥 HOT lead triggered: ${phone}`);
    }

    res.json({ success: true, score: scored?.score });
  } catch (err) {
    console.error('Track error:', err.message);
    res.status(500).json({ error: 'Internal error' });
  }
});

/**
 * POST /api/wa-webhook
 * WhatsApp Business API incoming messages
 */
router.get('/api/wa-webhook', (req, res) => {
  // Verification challenge from Meta
  const mode = req.query['hub.mode'];
  const token = req.query['hub.verify_token'];
  const challenge = req.query['hub.challenge'];

  const VERIFY_TOKEN = process.env.WA_VERIFY_TOKEN;
  if (VERIFY_TOKEN && mode === 'subscribe' && token === VERIFY_TOKEN) {
    // Echo only the numeric challenge — prevents any injection via crafted query params
    const safeChallenge = String(parseInt(challenge, 10) || '');
    return res.send(safeChallenge);
  }
  res.sendStatus(403);
});

router.post('/api/wa-webhook', async (req, res) => {
  try {
    const entry = req.body?.entry?.[0];
    const change = entry?.changes?.[0]?.value;
    const msg = change?.messages?.[0];

    if (!msg) return res.sendStatus(200);

    const phone = msg.from;
    const text = msg.text?.body || '';

    if (!text || !phone) return res.sendStatus(200);

    console.log(`📨 WA message from ${phone}: "${text}"`);

    const { dnd } = await handleIncoming(phone, text);
    if (dnd) return res.sendStatus(200);

    const { intents, scheduledFollowups } = processIncomingMessage(phone, text);
    if (intents.length > 0) {
      console.log(`🧠 Detected intents: ${intents.map(i => i.intent).join(', ')} | Scheduled: ${scheduledFollowups.length} follow-ups`);
    }

    stopFollowups(phone);

    const lead = getLead(phone);
    enqueue('SEND_AI_REPLY', { phone, message: text, leadName: lead?.name }, { delayMs: 1000 });

    res.sendStatus(200);
  } catch (err) {
    console.error('WA webhook error:', err.message);
    res.sendStatus(200);
  }
});

/**
 * POST /api/book-meeting
 * Body: { phone, slotStart, slotEnd, notes }
 */
router.post('/api/book-meeting', async (req, res) => {
  try {
    const { phone, slotStart, slotEnd, notes } = req.body;
    if (!phone || !slotStart) return res.status(400).json({ error: 'phone and slotStart required' });

    const lead = getLead(phone);
    if (!lead) return res.status(404).json({ error: 'Lead not found' });

    const result = await bookMeeting({ lead, slotStart, slotEnd, notes });

    if (result.success) {
      updateLead(phone, { score: 'VERY_HOT' });
      enqueue('ADMIN_ALERT', { phone, event: 'Meeting Booked' }, {});
      scheduleMeetingReminders(phone, slotStart);
      saveConversation(phone, 'system', `Meeting booked for ${new Date(slotStart).toLocaleDateString('en-IN')}`, 'meeting_booked');
    }

    res.json(result);
  } catch (err) {
    console.error('Book meeting error:', err);
    res.status(500).json({ error: 'Booking failed, please try again' });
  }
});

/**
 * GET /api/calendar-slots
 */
router.get('/api/calendar-slots', async (req, res) => {
  try {
    const slots = await getAvailableSlots();
    res.json({ success: true, slots });
  } catch (err) {
    console.error('[calendar-slots]', err);
    res.json({ success: false, slots: [], error: 'Calendar service unavailable' });
  }
});

/**
 * GET /api/leads — Admin only
 */
router.get('/api/leads', adminAuth, (req, res) => {
  const leads = getAllLeads();
  res.json({ success: true, total: leads.length, leads });
});

/**
 * GET /api/lead-stats — Admin only
 */
router.get('/api/lead-stats', adminAuth, (req, res) => {
  res.json({ success: true, stats: getStats() });
});

/**
 * GET /api/lead-analytics — Source + Location analytics (Admin)
 */
router.get('/api/lead-analytics', adminAuth, (req, res) => {
  res.json({
    success: true,
    sources: getSourceAnalytics(),
    locations: getLocationAnalytics(),
    priorityLeads: getPriorityLeads(10),
    stats: getStats(),
    timestamp: new Date().toISOString(),
  });
});

/**
 * POST /api/report — Trigger manual report
 */
router.post('/api/report', adminAuth, async (req, res) => {
  try {
    const report = await generateAndSendReport();
    res.json({ success: true, report });
  } catch (err) {
    console.error('[report]', err);
    res.status(500).json({ error: 'Report generation failed' });
  }
});

/**
 * POST /api/ai-reply — Direct AI reply test (admin)
 */
router.post('/api/ai-reply', adminAuth, async (req, res) => {
  try {
    const { message, leadName } = req.body;
    const reply = await generateReply(message, { leadName });
    res.json({ success: true, reply });
  } catch (err) {
    console.error('[ai-reply]', err);
    res.status(500).json({ error: 'AI service unavailable' });
  }
});

export default router;
