/**
 * Daily Report Service — Summary generated every day at 8pm IST
 */
import { getStats, getAllLeads } from '../models/leadModel.js';
import { sendDailyReport } from './whatsappService.js';

let reportTimer = null;

/** Start daily report cron (8pm IST = 14:30 UTC) */
export function startDailyReporter() {
  scheduleNext();
  console.log('📊 Daily reporter started');
}

function scheduleNext() {
  const now = new Date();
  const next = new Date();

  // 8pm IST = UTC+5:30 → 14:30 UTC
  next.setUTCHours(14, 30, 0, 0);
  if (next <= now) next.setDate(next.getDate() + 1); // tomorrow

  const delay = next.getTime() - now.getTime();
  console.log(`📊 Next report in ${Math.round(delay / 60000)} minutes`);

  reportTimer = setTimeout(async () => {
    await generateAndSendReport();
    scheduleNext();
  }, delay);
}

export async function generateAndSendReport() {
  const stats = getStats();
  const leads = getAllLeads();

  // Today's new leads
  const today = new Date().toDateString();
  const todayLeads = leads.filter(l => new Date(l.createdAt).toDateString() === today);

  const report = {
    ...stats,
    newToday: todayLeads.length,
    timestamp: new Date().toISOString(),
  };

  console.log('📊 Daily Report:', report);

  try {
    await sendDailyReport(report);
  } catch (err) {
    console.error('Report send error:', err.message);
  }

  return report;
}
