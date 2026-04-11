/**
 * WhatsApp Business API Service
 * Env vars needed: WHATSAPP_ACCESS_TOKEN, WHATSAPP_PHONE_ID
 * Get from: Meta Business → WhatsApp → API Setup
 */

const WA_TOKEN = process.env.WHATSAPP_ACCESS_TOKEN;
const PHONE_ID = process.env.WHATSAPP_PHONE_ID;
const WA_API = `https://graph.facebook.com/v18.0/${PHONE_ID}/messages`;
const APP_LINK = process.env.APP_DOWNLOAD_LINK || 'https://sairolotech.app';

import { getLead, markDND } from '../models/leadModel.js';
import { isEnabled, increment, logError, isWithinDailyLimit, retryOperation } from './configService.js';
import { logWhatsApp, logSecurity } from './activityLogger.js';

const PHONE_COOLDOWN_MS = 4 * 60 * 60 * 1000;
const phoneLastSentMap = new Map();

setInterval(() => {
  const cutoff = Date.now() - PHONE_COOLDOWN_MS * 2;
  for (const [phone, ts] of phoneLastSentMap) {
    if (ts < cutoff) phoneLastSentMap.delete(phone);
  }
}, 30 * 60 * 1000);

function isConfigured() {
  return !!(WA_TOKEN && PHONE_ID);
}

async function sendRaw(to, body, options = {}) {
  const normalizedPhone = to.replace(/\D/g, '');
  const isAdminAlert = options?.isAdminAlert === true;

  if (!isEnabled('whatsappEnabled')) {
    logWhatsApp({ to: normalizedPhone, status: 'blocked', reason: 'whatsapp_disabled' });
    return { blocked: true, reason: 'whatsapp_disabled' };
  }

  if (!isAdminAlert) {
    const lastSent = phoneLastSentMap.get(normalizedPhone);
    if (lastSent && Date.now() - lastSent < PHONE_COOLDOWN_MS) {
      logWhatsApp({ to: normalizedPhone, status: 'blocked', reason: 'cooldown_4h' });
      return { blocked: true, reason: 'cooldown_active', nextAllowedAt: lastSent + PHONE_COOLDOWN_MS };
    }
  }

  if (!isWithinDailyLimit()) {
    logWhatsApp({ to: normalizedPhone, status: 'blocked', reason: 'daily_limit' });
    logError('WhatsApp', 'Daily message limit reached', `Attempted to send to ${to}`);
    return { blocked: true, reason: 'daily_limit_reached' };
  }

  if (!isConfigured()) {
    console.log(`[WA MOCK] To: ${to}`);
    increment('whatsappSent');
    phoneLastSentMap.set(normalizedPhone, Date.now());
    logWhatsApp({ to: normalizedPhone, status: 'mock_sent' });
    return { mock: true };
  }

  try {
    const result = await retryOperation(async () => {
      const res = await fetch(WA_API, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${WA_TOKEN}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          messaging_product: 'whatsapp',
          to: normalizedPhone,
          type: 'text',
          text: { body },
        }),
        signal: AbortSignal.timeout(10000),
      });

      if (!res.ok) {
        const err = await res.text();
        throw new Error(`WA API ${res.status}: ${err}`);
      }
      return res.json();
    }, 3, 1000);

    increment('whatsappSent');
    phoneLastSentMap.set(normalizedPhone, Date.now());
    logWhatsApp({ to: normalizedPhone, status: 'sent' });
    return result;
  } catch (e) {
    increment('whatsappFailed');
    logWhatsApp({ to: normalizedPhone, status: 'failed', error: e.message });
    logError('WhatsApp', e.message, `To: ${to} | Message: ${body.slice(0, 80)}`);
    throw e;
  }
}

/** Send first message — focused on app download */
export async function sendWelcomeMessage(lead) {
  const { phone, name } = lead;

  // Check DND
  const existing = getLead(phone);
  if (existing?.dnd) return;

  const msg =
`🙏 Namaste ${name}!

SAI RoloTech ki taraf se aapka swagat hai — New Delhi ki trusted Roll Forming Machine manufacturer.

Hamare *FREE app* mein ye sab milega:
✅ AI Quotation (instant machine quote)
✅ Maintenance Guide (apni machine ka care karo)
✅ Quality Check (production issues solve karo)

App download karein 👇
${APP_LINK}?user=${phone}

Koi bhi sawaal ho — hum yahan hain! 😊`;

  return sendRaw(phone, msg);
}

/** Send follow-up message based on day index */
export async function sendFollowup(lead, dayIndex) {
  const { phone, name } = lead;

  const existing = getLead(phone);
  if (existing?.dnd) return;

  const loc = existing?.locationPriority || 'UNKNOWN';

  // Location-aware message templates
  const NEAR_MESSAGES = [
    `Hi ${name}! App download kiya? Aap Delhi/NCR mein hain — hum same-day visit arrange kar sakte hain! 🔥 ${APP_LINK}?user=${phone}`,
    `${name} ji, aap nearby hain isliye personally discuss karna chahenge? Free factory visit arrange karte hain — bas ek call karein! 📞`,
    `Namaste ${name}! Nearby customers ke liye fast delivery + free installation support dete hain. Apni requirement share karein! 🏭`,
    `${name} ji, 2-3 din mein machine demo arrange kar sakte hain aapke paas. Kab convenient rahega? Meeting fix karte hain! 📅`,
    `Hi ${name}! Nearby hone ki wajah se 48-hour delivery aur lifetime support milta hai. Kya is week discuss kar sakte hain?`,
    `${name} ji, last message — kabhi bhi machine ki zaroorat ho, SAI RoloTech ek call door hai. Hum Delhi/NCR mein hain! 🙏`,
  ];

  const MEDIUM_MESSAGES = [
    `Hi ${name}! App download kiya? Hum aapki machine query instantly solve kar sakte hain — free consultation bhi! ${APP_LINK}?user=${phone}`,
    `${name} ji, aapki requirement ke hisaab se best machine suggest kar sakte hain. Detail share karein, quote bhejte hain! 📋`,
    `Namaste ${name}! Is mahine special offer hai. Customize quote + delivery plan ke saath bhejte hain — bata dein requirements! 🏭`,
    `${name} ji, video call pe machine demo arrange kar sakte hain. Aap interested hain to time fix karte hain!`,
    `Hi ${name}! Customers ne hamare saath switch karke cost 25% kam ki. Aap bhi discuss karna chahenge? 15-min video call?`,
    `${name} ji, last message — future mein machine zaroorat ho to zaroor batayein. SAI RoloTech hamesha available! 🙏`,
  ];

  const FAR_MESSAGES = [
    `Hi ${name}! SAI RoloTech CRM app mein detailed machine info, specs aur quotes mil jaate hain. Explore karein! ${APP_LINK}?user=${phone}`,
    `${name} ji, app mein apni requirement ke hisaab se quote generate kar sakte hain. Koi sawaal ho toh bata dein! 💬`,
    `Namaste ${name}! Aap app mein machine guide aur troubleshooting bhi dekh sakte hain — bilkul free! 🔧`,
    `${name} ji, agar future mein machine ki zaroorat ho toh please consider karein. Online delivery arrangement possible hai!`,
    `Hi ${name}! Aapki requirement note kar li gayi hai. Jab bhi decide karein, main details share kar sakta hoon.`,
    `${name} ji, thank you for considering SAI RoloTech. Kabhi bhi contact karein — always here to help! 🙏`,
  ];

  let MESSAGES;
  if (loc === 'HIGH') MESSAGES = NEAR_MESSAGES;
  else if (loc === 'MEDIUM') MESSAGES = MEDIUM_MESSAGES;
  else MESSAGES = FAR_MESSAGES;

  const msg = MESSAGES[Math.min(dayIndex, MESSAGES.length - 1)];
  return sendRaw(phone, msg);
}

/** Send hot lead alert to admin — enhanced with location+score combo detection */
export async function sendAdminAlert(lead, event) {
  const ADMIN_PHONE = process.env.ADMIN_PHONE;
  if (!ADMIN_PHONE) return;

  const loc   = (lead.locationPriority || 'UNKNOWN').toUpperCase();
  const score = (lead.score || '').toUpperCase();

  // 🚨 GOLDEN COMBO: NEAR + HOT = maximum priority alert
  const isGolden = loc === 'HIGH' && (score === 'HOT' || score === 'VERY_HOT' || score === 'VERY HOT');

  const header = isGolden
    ? '🚨 URGENT — GOLDEN LEAD!\n(NEAR + HOT = MAX PROFIT 💰)\n'
    : '🔥 HOT LEAD ALERT!\n';

  const locationLabel =
    loc === 'HIGH'   ? '📍 NEAR (Delhi/NCR) — Fast close possible!' :
    loc === 'MEDIUM' ? '📍 MEDIUM (North India)' :
    loc === 'LOW'    ? '📍 FAR (South/Other)' : '📍 Location unknown';

  const action = isGolden
    ? '\n👉 Call IMMEDIATELY — same-day visit arrange karo!'
    : loc === 'HIGH'
      ? '\n👉 Call today — nearby lead, fast close possible.'
      : '\n👉 Follow up within 2-3 days.';

  const msg =
`${header}
Name:     ${lead.name}
Phone:    ${lead.phone}
${locationLabel}
Score:    ${lead.score || 'N/A'}
Source:   ${lead.source || 'N/A'}
Event:    ${event}
Time:     ${new Date().toLocaleString('en-IN')}
${action}`;

  return sendRaw(ADMIN_PHONE, msg, { isAdminAlert: true });
}

/** Send quotation-triggered message */
export async function sendQuotationFollowup(lead) {
  const { phone, name } = lead;
  const existing = getLead(phone);
  if (existing?.dnd) return;

  const msg = `${name} ji! Aapne quotation create kiya — bahut achha! 🎉

Kya main aapki further help kar sakta hoon?
- Machine specs ke baare mein?
- Delivery timeline?  
- Installation support?

Batayein, hum ready hain! 😊`;

  return sendRaw(phone, msg);
}

/** Handle incoming message — check DND keywords */
const MEETING_KEYWORDS = ['demo', 'meeting', 'milna', 'dekhna', 'visit', 'dikha', 'call', 'video call', 'factory visit', 'time slot', 'appointment'];

export async function handleIncoming(phone, message) {
  const lower = message.toLowerCase().trim();
  const DND_WORDS = ['stop', 'remove', 'no message', 'mat bhejo', 'band karo', 'unsubscribe'];

  if (DND_WORDS.some(w => lower.includes(w))) {
    markDND(phone);
    console.log(`🚫 DND set for ${phone}`);
    await sendRaw(phone, 'Aapko unsubscribe kar diya gaya hai. Agar future mein zaroorat ho toh contact karein. 🙏');
    return { dnd: true };
  }

  if (MEETING_KEYWORDS.some(k => lower.includes(k))) {
    console.log(`📅 Meeting interest detected from ${phone}: "${message}"`);
    const lead = getLead(phone);
    const name = lead?.name || 'Sir';
    const slotMsg =
`${name} ji, meeting ke liye ye slots available hain:

📅 *Available Time Slots:*
• 10:00 AM
• 11:00 AM
• 2:00 PM
• 3:00 PM
• 5:00 PM

Koi bhi time batayein — hum turant confirm kar denge!

Meeting type:
🏭 Factory Visit (Mundka, Delhi)
📹 Video Call (WhatsApp/Google Meet)
🏢 Aapki site par visit

Bas reply karein apna preferred time aur type! 🙏`;

    try {
      await sendRaw(phone, slotMsg, { isAdminAlert: true });
    } catch (e) {
      console.error(`[Meeting Auto] Failed to send slots to ${phone}:`, e.message);
    }
    return { dnd: false, message, meetingInterest: true };
  }

  return { dnd: false, message };
}

/** Send daily report to admin via WhatsApp */
export async function sendDailyReport(stats) {
  const ADMIN_PHONE = process.env.ADMIN_PHONE;
  if (!ADMIN_PHONE) return;

  const msg =
`📊 SAI RoloTech Daily Report
${new Date().toLocaleDateString('en-IN')}

👥 Total Leads: ${stats.total}
🔥 Hot: ${stats.hot} | Very Hot: ${stats.veryHot}
🌡️ Warm: ${stats.warm} | ❄️ Cold: ${stats.cold}
📱 App Installed: ${stats.appInstalled}
📅 Meetings: ${stats.meetings}
🚫 DND: ${stats.dnd}`;

  return sendRaw(ADMIN_PHONE, msg);
}

/** Send a custom message — with content safety filter */
const WA_BLOCKED_CONTENT = [
  /https?:\/\/(?!(?:www\.)?sairolotech\.(?:com|app)(?:\/|$))/i,
  /click\s+(?:here|this|now)/i,
  /you\s+(?:won|win|selected)/i,
  /free\s+(?:money|cash|gift|prize)/i,
  /(?:otp|password|bank\s*account|card\s*number)/i,
];

export async function sendCustom(phone, text) {
  if (!text || typeof text !== 'string' || text.trim().length < 2) {
    return { blocked: true, reason: 'empty_message' };
  }
  if (text.length > 1000) {
    return { blocked: true, reason: 'message_too_long' };
  }
  for (const pattern of WA_BLOCKED_CONTENT) {
    if (pattern.test(text)) {
      console.warn(`[WA FILTER] Blocked suspicious content to ${phone}: ${pattern.source}`);
      return { blocked: true, reason: 'content_blocked' };
    }
  }
  return sendRaw(phone, text);
}

export { isConfigured };
