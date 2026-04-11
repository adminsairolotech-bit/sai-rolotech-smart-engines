/**
 * Firebase Cloud Messaging (FCM) — Push Notifications
 * Env var needed: FIREBASE_SERVICE_ACCOUNT_JSON (base64 encoded JSON)
 * If app not installed → falls back to WhatsApp
 */

const FCM_KEY = process.env.FCM_SERVER_KEY; // Legacy key OR use service account

const PUSH_SCHEDULE = [
  { day: 0, title: '👋 SAI RoloTech mein swagat!', body: 'Hamare app features explore karein — AI quote, maintenance guide aur zyada.' },
  { day: 1, title: '💡 Kya aapko pata tha?', body: '60 seconds mein instant machine quotation bana sakte hain!' },
  { day: 2, title: '🔧 Machine Problem?', body: 'Hamare maintenance guide se apni machine ki care karein.' },
  { day: 3, title: '📅 Free Demo Book Karein', body: 'Expert se 15-min call schedule karein — bilkul free!' },
];

export async function sendPushNotification({ fcmToken, title, body, data = {} }) {
  if (!FCM_KEY || !fcmToken) {
    console.log(`📱 [FCM MOCK] Push: "${title}" → ${fcmToken || 'no-token'}`);
    return { mock: true };
  }

  try {
    const res = await fetch('https://fcm.googleapis.com/fcm/send', {
      method: 'POST',
      headers: {
        'Authorization': `key=${FCM_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        to: fcmToken,
        notification: { title, body, icon: '/icons/icon-192.png', click_action: 'FLUTTER_NOTIFICATION_CLICK' },
        data,
      }),
      signal: AbortSignal.timeout(8000),
    });

    const result = await res.json();
    if (result.success !== 1) throw new Error(JSON.stringify(result));
    return result;
  } catch (err) {
    console.error('FCM error:', err.message);
    throw err;
  }
}

/** Schedule push notifications for a new app user */
export function schedulePushSequence(lead, enqueue) {
  const DAY_MS = 24 * 60 * 60 * 1000;

  PUSH_SCHEDULE.forEach(({ day, title, body }) => {
    enqueue('SEND_PUSH', {
      phone: lead.phone,
      fcmToken: lead.fcmToken,
      title,
      body,
    }, { delayMs: day * DAY_MS });
  });

  console.log(`📱 Scheduled push sequence for ${lead.phone}`);
}
