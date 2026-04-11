/**
 * Google Calendar Integration — Meeting Booking
 * Uses same Google OAuth as Gmail (already configured)
 */
import { google } from 'googleapis';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { stopOnMeeting } from './followupService.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const TOKENS_PATH = path.join(__dirname, '..', '..', 'data', 'calendar_tokens.json');
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary';

function getOAuth2Client() {
  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.GOOGLE_REDIRECT_URI,
  );

  if (fs.existsSync(TOKENS_PATH)) {
    const tokens = JSON.parse(fs.readFileSync(TOKENS_PATH, 'utf8'));
    client.setCredentials(tokens);
  }

  return client;
}

/** Get available slots for next 3 days (9am-6pm IST, 1hr slots) */
export async function getAvailableSlots() {
  try {
    const auth = getOAuth2Client();
    const calendar = google.calendar({ version: 'v3', auth });

    const now = new Date();
    const end = new Date(now.getTime() + 3 * 24 * 60 * 60 * 1000);

    const busy = await calendar.freebusy.query({
      requestBody: {
        timeMin: now.toISOString(),
        timeMax: end.toISOString(),
        items: [{ id: CALENDAR_ID }],
      },
    });

    const busySlots = busy.data.calendars?.[CALENDAR_ID]?.busy || [];
    const slots = [];

    // Generate 9am-6pm slots for next 3 days
    for (let d = 0; d < 3; d++) {
      const date = new Date(now);
      date.setDate(date.getDate() + d + 1);
      date.setHours(9, 0, 0, 0);

      for (let h = 9; h < 18; h++) {
        const slotStart = new Date(date);
        slotStart.setHours(h, 0, 0, 0);
        const slotEnd = new Date(slotStart.getTime() + 60 * 60 * 1000);

        // Check if slot is free
        const conflict = busySlots.some(b =>
          new Date(b.start) < slotEnd && new Date(b.end) > slotStart
        );

        if (!conflict) {
          slots.push({
            start: slotStart.toISOString(),
            end: slotEnd.toISOString(),
            label: slotStart.toLocaleString('en-IN', { weekday: 'short', day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' }),
          });
        }
      }
    }

    return slots.slice(0, 8); // Max 8 slots
  } catch (err) {
    console.error('Calendar getSlots error:', err.message);
    return [];
  }
}

/** Book a meeting */
export async function bookMeeting({ lead, slotStart, slotEnd, notes = '' }) {
  try {
    const auth = getOAuth2Client();
    const calendar = google.calendar({ version: 'v3', auth });

    const event = await calendar.events.insert({
      calendarId: CALENDAR_ID,
      requestBody: {
        summary: `Meeting: ${lead.name} (${lead.phone})`,
        description: `Lead Source: ${lead.source}\nPhone: ${lead.phone}\nEmail: ${lead.email || 'N/A'}\nNotes: ${notes}`,
        start: { dateTime: slotStart, timeZone: 'Asia/Kolkata' },
        end: { dateTime: slotEnd, timeZone: 'Asia/Kolkata' },
        reminders: {
          useDefault: false,
          overrides: [
            { method: 'popup', minutes: 60 },
            { method: 'popup', minutes: 10 },
          ],
        },
        attendees: lead.email ? [{ email: lead.email }] : [],
      },
    });

    // Stop follow-ups since meeting is booked
    stopOnMeeting(lead.phone);

    console.log(`📅 Meeting booked for ${lead.phone}: ${event.data.id}`);
    return { success: true, eventId: event.data.id, link: event.data.htmlLink };
  } catch (err) {
    console.error('Calendar bookMeeting error:', err.message);
    console.error('[calendar]', err);
    return { success: false, error: 'Calendar service unavailable' };
  }
}
