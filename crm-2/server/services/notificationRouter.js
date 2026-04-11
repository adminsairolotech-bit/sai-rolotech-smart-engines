import { sendPushNotification } from './fcmService.js';
import { getLead } from '../models/leadModel.js';
import { logSystem } from './activityLogger.js';

export function getNotificationChannel(lead) {
  if (!lead) return 'whatsapp';

  const hasApp = lead.appInstalled && lead.fcmToken;
  const isHot = lead.score === 'HOT' || lead.score === 'VERY_HOT';

  if (isHot && hasApp) return 'both';
  if (hasApp) return 'push';
  return 'whatsapp';
}

export async function smartNotify({ phone, title, body, waMessage, data = {} }) {
  const lead = getLead(phone);
  const channel = getNotificationChannel(lead);

  const result = { channel, pushSent: false, waSent: false };

  if (channel === 'push' || channel === 'both') {
    try {
      if (lead?.fcmToken) {
        await sendPushNotification({ fcmToken: lead.fcmToken, title, body, data });
        result.pushSent = true;
      }
    } catch (err) {
      console.error(`[NotifRouter] Push failed for ${phone}:`, err.message);
    }
  }

  if (channel === 'whatsapp' || channel === 'both') {
    result.waSent = true;
  }

  logSystem({ type: 'notification_routed', channel, phone: phone?.slice(0, -4) + 'XXXX', pushSent: result.pushSent, waSent: result.waSent });

  return result;
}

export function getRoutingStats(leads) {
  const stats = { push: 0, whatsapp: 0, both: 0 };
  for (const lead of leads) {
    const ch = getNotificationChannel(lead);
    stats[ch] = (stats[ch] || 0) + 1;
  }
  return stats;
}
