/**
 * Follow-up Engine — Location-aware automated follow-up schedule
 * HIGH leads = near-daily, MEDIUM = every 2-3 days, LOW = weekly/monthly
 */
import { enqueue } from './queueService.js';
import { getAllLeads, getActiveLeads, updateLead, getLead } from '../models/leadModel.js';

const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Location-based schedules: [dayOffset, label]
 * HIGH (Delhi/NCR) → aggressive: near-daily contact for fast closure
 * MEDIUM (North India) → moderate: every 2-3 days
 * LOW (South/Far) → light: weekly, then monthly (time bachao)
 */
const SCHEDULES = {
  HIGH: [
    [1,  'day1'],
    [2,  'day2'],
    [3,  'day3'],
    [5,  'day5'],
    [7,  'day7'],
    [10, 'day10'],
    [15, 'day15'],
    [20, 'day20'],
  ],
  MEDIUM: [
    [1,  'day1'],
    [3,  'day3'],
    [7,  'day7'],
    [15, 'day15'],
    [30, 'month1'],
    [60, 'month2'],
  ],
  LOW: [
    [3,  'day3'],
    [7,  'day7'],
    [30, 'month1'],
    [90, 'month3'],
  ],
  UNKNOWN: [
    [1,  'day1'],
    [3,  'day3'],
    [7,  'day7'],
    [15, 'day15'],
    [30, 'month1'],
    [60, 'month2'],
  ],
};

/** Get the right schedule for a lead based on location priority */
function getSchedule(lead) {
  const loc = lead?.locationPriority || 'UNKNOWN';
  return SCHEDULES[loc] || SCHEDULES.UNKNOWN;
}

/** Schedule all follow-ups for a new lead (location-aware) */
export function scheduleFollowups(lead) {
  const createdAt = new Date(lead.createdAt).getTime();
  const schedule = getSchedule(lead);
  const loc = lead?.locationPriority || 'UNKNOWN';

  schedule.forEach(([dayOffset, label], index) => {
    const runAt = createdAt + dayOffset * DAY_MS;
    const delayMs = Math.max(0, runAt - Date.now());

    enqueue('SEND_FOLLOWUP', {
      phone: lead.phone,
      followupIndex: index,
      label,
    }, { delayMs });
  });

  const firstRunAt = createdAt + schedule[0][0] * DAY_MS;
  updateLead(lead.phone, { nextFollowup: new Date(firstRunAt).toISOString() });

  console.log(`📅 Scheduled ${schedule.length} follow-ups for ${lead.phone} [${loc} schedule]`);
}

/** Called when user replies — stop further follow-ups */
export function stopFollowups(phone) {
  updateLead(phone, {
    followupIndex: 999,
    lastContact: new Date().toISOString(),
  });
  console.log(`⛔ Follow-ups stopped for ${phone} (user replied)`);
}

/** Called when meeting booked */
export function stopOnMeeting(phone) {
  updateLead(phone, {
    meetingBooked: true,
    followupIndex: 999,
    lastContact: new Date().toISOString(),
  });
  console.log(`📅 Meeting booked, follow-ups stopped for ${phone}`);
}

/** Restart follow-up scheduler on server boot — catch up missed jobs */
export function resumeFollowups() {
  const active = getActiveLeads();
  let resumed = 0;

  active.forEach(lead => {
    if (!lead.nextFollowup) return;

    const due = new Date(lead.nextFollowup).getTime();
    if (due <= Date.now()) {
      enqueue('SEND_FOLLOWUP', {
        phone: lead.phone,
        followupIndex: lead.followupIndex,
        label: 'resume',
      }, { delayMs: 5000 });
      resumed++;
    }
  });

  if (resumed > 0) {
    console.log(`🔄 Resumed ${resumed} missed follow-ups`);
  }
}
